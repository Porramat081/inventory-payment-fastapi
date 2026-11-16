from main import redis , Order , OrderStatus
import time

key = 'refund_order'
group = 'payment_group'

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
                order = Order.get(obj['pk'])
                order.status = OrderStatus.refunded
                order.save()
                print(f'order {obj['pk']} was refuned.')
                    
    except Exception as e :
        print(str(e))
    time.sleep(1) # delay 1 sec between event

# run event consumer : python3 consumer.py