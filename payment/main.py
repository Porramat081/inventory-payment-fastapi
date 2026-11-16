import time

import httpx
from fastapi import FastAPI , Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.background import BackgroundTasks
from redis_om import get_redis_connection , HashModel , Field
from enum import Enum
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['http://localhost:5173'],
    allow_methods = ['*'],
    allow_headers = ['*']
)

# this should be other database - diff from inventory database.
redis = get_redis_connection(
    host = "brass-macrobright-ultragentle-48154.db.redis.io",
    port=18249,
    decode_responses=True,
    password="JtjRQCP8W8MQuA9LVSXAYXTXbMw5U2Ta"
)

class OrderStatus(str,Enum):
    pending = "pending"
    completed = "completed"
    refunded = "refunded"

class OrderCreate(BaseModel):
    id : str
    quantity : int
    
class Order(HashModel , index = True):
    product_id : str
    price : float
    fee : float
    total : float
    quantity : int
    status : OrderStatus 

    class Meta:
        database = redis


@app.post('/orders')
async def create(order:OrderCreate , background_tasks : BackgroundTasks): # retrive id , quantity from user
    async with httpx.AsyncClient() as client:
        res = await client.get(f"http://localhost:8000/product/{order.id}")
        product = res.json()

        order = Order(
            product_id = order.id,
            price = product['price'],
            fee = product['price'] * 0.2,
            total = product['price'] * 1.2,
            quantity = order.quantity,
            status = OrderStatus.pending
        ) # type: ignore

        order.save() # type: ignore

        background_tasks.add_task(order_completed , order) # type: ignore
        
        return order

def order_completed(order : Order):
    time.sleep(10) # delay 10 second
    order.status = OrderStatus.completed
    order.save()
    # add event
    redis.xadd('order_completed' , order.model_dump() , '*')
    

@app.get('/orders')
async def getAll():
    return Order.all_pks()

@app.get('/orders/{pk}')
async def get(pk:str):
    return Order.get(pk)

@app.delete('/order/all')
def deleteAll():
    pks = list(Order.all_pks())
    for pk in pks:
        Order.delete(pk)
    return {"deleted": len(pks)}

@app.delete('/order/{pk}')
def delete(pk:str):
    return Order.delete(pk)
