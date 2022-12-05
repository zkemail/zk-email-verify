import boto3
import os
import tarfile
import time

# Set up the client for the AWS S3 service
s3 = boto3.client('s3') # Ask Aayush for the access key and secret access key

# Set the name of the remote directory and the AWS bucket
zkey_dir = '../build/email/'
wasm_dir = '../build/email/email_js/'
bucket_name = 'zkemail-zkey-chunks' # us-east-1

def upload_to_s3(filename, dir=""):
    with open(dir + filename, 'rb') as file:
        print("Starting upload...")
        s3.upload_fileobj(file, bucket_name, filename, ExtraArgs={'ACL': 'public-read', 'ContentType': 'binary/octet-stream'})
        print("Done uploading!")

# Loop through the files in the remote directory
for dir in [zkey_dir, wasm_dir]:
    for file in os.listdir(dir):
        # Check if the file matches the pattern
        if file.startswith('email.zkey'):
            # upload_to_s3(file, dir) # Uncompressed file

            # Create a zip file for the file
            tar_file_name = file + '.tar.gz'
            with tarfile.open(tar_file_name, 'w:gz') as tar_file:
                print("Compressing: ", dir + file)
                tar_file.add(dir + file)

            # Upload the zip file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(tar_file_name)

            os.remove(tar_file_name)

        if file.startswith('vkey.json') or file.startswith('email.wasm'):
            # Upload the zip file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(file, dir)
