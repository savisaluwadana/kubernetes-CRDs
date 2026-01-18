import kopf
import kubernetes.client
from kubernetes.client.rest import ApiException
import yaml
import os

@kopf.on.create('database.example.com', 'v1', 'mysqls')
def create_fn(spec, name, namespace, logger, **kwargs):
    size = spec.get('storage_size', '1Gi')
    
    # Define the "Child" objects we want to create
    
    # 1. The Persistent Volume Claim (Hard Drive)
    pvc_body = yaml.safe_load(f"""
        apiVersion: v1
        kind: PersistentVolumeClaim
        metadata:
          name: mysql-pvc-{name}
        spec:
          accessModes: [ "ReadWriteOnce" ]
          resources:
            requests:
              storage: {size}
    """)

    # 2. The Deployment (The Database)
    deploy_body = yaml.safe_load(f"""
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: mysql-deploy-{name}
          labels:
            app: mysql-{name}
        spec:
          replicas: 1
          selector:
            matchLabels:
              app: mysql-{name}
          template:
            metadata:
              labels:
                app: mysql-{name}
            spec:
              containers:
              - name: mysql
                image: mysql:5.7
                env:
                - name: MYSQL_ROOT_PASSWORD
                  value: "supersecret"
                ports:
                - containerPort: 3306
                volumeMounts:
                - name: mysql-store
                  mountPath: /var/lib/mysql
              volumes:
              - name: mysql-store
                persistentVolumeClaim:
                  claimName: mysql-pvc-{name}
    """)

    # 3. The Service (Network Access)
    svc_body = yaml.safe_load(f"""
        apiVersion: v1
        kind: Service
        metadata:
          name: mysql-service-{name}
        spec:
          selector:
            app: mysql-{name}
          ports:
          - port: 3306
            targetPort: 3306
    """)

    # Adopt the children! 
    # This means if you delete the MySQL object, K8s deletes the PVC/Deployment automatically.
    kopf.adopt(pvc_body)
    kopf.adopt(deploy_body)
    kopf.adopt(svc_body)

    # Actually talk to the API to create them
    api = kubernetes.client.CoreV1Api()
    apps_api = kubernetes.client.AppsV1Api()

    try:
        api.create_namespaced_persistent_volume_claim(namespace, pvc_body)
        apps_api.create_namespaced_deployment(namespace, deploy_body)
        api.create_namespaced_service(namespace, svc_body)
        return {'status': 'Database Created', 'connection': f'mysql-service-{name}:3306'}
    except ApiException as e:
        raise kopf.PermanentError(f"Failed to create resources: {e}")