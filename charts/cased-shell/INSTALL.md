<!-- update with yarn charts:docs -->

## Installation

- The Chart for Cased Shell is distributed as an OCI image. Contact [Cased](https://cased.com) for access to the image.
- Construct a values file using the documentation below as a reference making sure to set `config.key` and `ingress.fqdn` and any other values required for your deployment:
  - `postgresql.*` values influence where relational data is stored.
  - `vault.*` values influence where secrets are stored.
  - `config.objectStorageBackend` influences where object storage is stored.
- Install the Chart using `helm install`, `helm upgrade --install`, or using your preferred CI/CD system.

### Example values files

Simple

```yaml
config:
  key: 476777626aae4d0daea431610c7a09ef

ingress:
  fqdn: shell.example.com
```

AWS EKS, ELB, RDS, and S3

```yaml
config:
  key: 476777626aae4d0daea431610c7a09ef

# Use https://github.com/kubernetes-sigs/aws-load-balancer-controller to route traffic
# Use https://github.com/kubernetes-sigs/external-dns to manage DNS records
ingress:
  enabled: true
  fqdn: helm-alb-example.route53-hosted-zone.example.com
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/backend-protocol: HTTPS
    alb.ingress.kubernetes.io/target-type: 'ip'
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/healthcheck-path: /_ping

    # ALB idle timeout is 60 seconds by default.
    # You may want to increase this to allow for SSH sessions to be idle for longer.
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=600

    # optional, can be used if certificate autodetection doesn't work or doesn't detect the right cert
    # alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:5938688156789:certificate/59386881-b1dc-43d0-b671-5f7c65a28746

    external-dns.alpha.kubernetes.io/hostname: helm-alb-example.route53-hosted-zone.example.com

# Use an existing RDS instance for relational data
postgresql:
  enabled: false
  auth:
    database: 'cased'
    username: 'cased'
    password: '05c28cf475dc'
  external:
    host: db20221110151837801900000001.kvrpfqcjbhkd.us-west-2.rds.amazonaws.com
    port: 5432

# Configure the application to store session logs in an S3 bucket
config:
  objectStorageBackend: s3

aws:
  s3:
    bucket: example-cased-shell-bucket
  region: us-west-2
  key:
    access: SECRET
    secret: SECRET
```

[ingress-nginx](https://github.com/kubernetes/ingress-nginx) and [cert-manager](https://cert-manager.io/):

```yaml
config:
  secret: 476777626aae4d0daea431610c7a09ef

ingress:
  enabled: true
  fqdn: 'nginx-cased-shell.shell.example.com'
  secretName: 'cased-shell-letsencrypt-production'
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/backend-protocol: 'HTTPS'
```

<!-- update with yarn charts:docs -->
