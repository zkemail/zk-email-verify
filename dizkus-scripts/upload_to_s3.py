import boto3
import os
import tarfile
import time
import gzip

# Set up the client for the AWS S3 service
s3 = boto3.client('s3')  # Ask Aayush for the access key and secret access key

# Set the name of the remote directory and the AWS bucket
source = '~/Documents/projects/zk-email-verify'
source = '.'
zkey_dir = source + '/chunked_build/email/'
wasm_dir = source + '/chunked_build/email/email_js/'
bucket_name = 'zkemail-zkey-chunks'  # us-east-1


def upload_to_s3(filename, dir=""):
    with open(dir + filename, 'rb') as file:
        print("Starting upload...")
        s3.upload_fileobj(file, bucket_name, filename, ExtraArgs={
                          'ACL': 'public-read', 'ContentType': 'binary/octet-stream'})
        print("Done uploading ", filename, "!")


# Loop through the files in the remote directory
for dir in [zkey_dir, wasm_dir]:
    for file in os.listdir(dir):
        # Check if the file matches the pattern
        if file.startswith('email.zkey'):
            source_file_path = dir + file
            upload_to_s3(file, dir)  # Uncompressed file

            # Make a .gz file
            print("Compressing .gz: ", source_file_path)
            gz_file = file + ".gz"
            with open(source_file_path, 'rb') as f_in, gzip.open(gz_file, 'wb') as f_out:
                f_out.write(f_in.read())
            gz_file_name = file + '.gz'
            # Upload the zip file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(gz_file)

            # Create a .tar.gz file for the file
            tar_file_name = file + '.tar.gz'
            print("Compressing .tar.gz: ", source_file_path)
            with tarfile.open(tar_file_name, 'w:gz') as tar_file:
                tar_file.add(source_file_path,
                             arcname=os.path.basename(source_file_path))

            # Upload the .tar.gz file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(tar_file_name)

            os.remove(tar_file_name)
            os.remove(gz_file_name)

        if file.startswith('vkey.json') or file.startswith('email.wasm'):
            # Upload the zip file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(file, dir)
