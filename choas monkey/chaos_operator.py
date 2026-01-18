import kopf
import kubernetes.client
import random
import time

@kopf.on.create('ops.example.com', 'v1', 'chaosmonkeys')
def kill_random_pod(spec, namespace, logger, **kwargs):
    target_label = spec.get('target_app_label')
    
    if not target_label:
        raise kopf.PermanentError("You must provide a target_app_label")

    api = kubernetes.client.CoreV1Api()
    
    # 1. Find the pods
    pods = api.list_namespaced_pod(namespace, label_selector=f"app={target_label}")
    
    if len(pods.items) == 0:
        logger.info(f"No pods found with label app={target_label}")
        return {'status': 'No Victims Found'}

    # 2. Pick a victim
    victim = random.choice(pods.items)
    victim_name = victim.metadata.name
    
    logger.info(f"😈 Chaos Monkey selected victim: {victim_name}")
    
    # 3. Terminate the victim
    api.delete_namespaced_pod(victim_name, namespace)
    
    return {'status': f'Killed {victim_name}'}