from main import redis , Product
import time

key = 'order_completed'
group = 'inventory_group'

try:
    redis.xgroup_create(key , group , mkstream=True)
except Exception as e:
    if 'BUSYGROUP' not in str(e):   # group already exists -> fine
        raise

while True:
    try:
        results = redis.xreadgroup(group , key , {key : '>'} , None) # type: ignore
        if results != []:
            for result in results:
                obj = result[1][0][1]
                try:
                    product = Product.get(obj['product_id'])
                    product.quantity = product.quantity - int(obj['quantity'])
                    product.save()
                    print(f'complete save order {obj['pk']} for product {obj['product_id']} : {obj['quantity']}')
                except:
                    print("Not found product - refund order")
                    redis.xadd('refund_order' , obj , '*')

    except Exception as e :
        print(str(e))
    time.sleep(1) # delay 1 sec between event

# run event consumer : python3 consumer.py