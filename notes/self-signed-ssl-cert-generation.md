# Self-signed Certificate

This document describes the steps to create a self-signed SSL/TLS certificate with SAN details.

## Prerequisites

* OpenSSL

## Steps

Run the following commands in your terminal:

1. Generate a private key:

    ```bash
    # Generate a private key
    openssl genrsa -out localhost.private.key 2048
    ```

2. Create a self-signed CA certificate:

    ```bash
    # Create a self-signed CA certificate
    openssl req -new -x509 -days 3650 -nodes -key localhost.private.key -sha256 -out localhost.ca.cer
    ```

3. Generate a certificate signing request (CSR):

    ```bash
    # Generate a certificate signing request (CSR)
    openssl req -new -nodes -out localhost.csr -keyout localhost.key -config localhost.ssl.conf
    ```
    * Note: Sample `localhost.ssl.conf`:
        ```
            [req]
            distinguished_name = dn
            default_bits = 2048
            default_md = sha256
            prompt = no

            [dn]
            C = IN
            ST = Karnataka
            L = Bengaluru
            O = Abc India Pvt Ltd
            OU = Research and development
            CN = localhost
            emailAddress = abc.pvt@email.com
        ```

4. Generate Self Signed X.509 SSL/TLS certificate:

    ```bash
    # Generate Self Signed X.509 SSL/TLS certificate
    openssl x509 -req -in localhost.csr -CA localhost.ca.cer -CAkey localhost.private.key -CAcreateserial -out localhost.crt -days 3650 -extfile localhost_v3.ext
    ```
    * Note: Sample `localhost_v3.ext`:
        ```
            authorityKeyIdentifier=keyid,issuer
            basicConstraints=CA:FALSE
            keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
            subjectAltName = @alt_names

            [alt_names]
            DNS.1   = localhost
            IP.1   = 127.0.0.1
        ```

### Usage

* install `localhost.ca.cer` as trusted CA Certificate in local system.
* Use the `localhost.key` and `localhost.crt` files in your local server SSL/TLS configuration.

### Note

Make sure to replace localhost in the above commands with the appropriate domain or IP address for your local development environment. . Self-signed certificates are not recommended for production use.

## Conclusion

By following these steps, you should now have a self-signed SSL certificate that can be used to secure your local server. However, please keep in mind that using a self-signed certificate means that clients accessing your server will see a security warning. If you want to avoid this warning, you can purchase an SSL certificate from a trusted Certificate Authority (CA).