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
            gz_file_name = file + '.gz'
            gz_file_path = source_file_path + ".gz"
            f_in = open(source_file_path)
            f_out = gzip.open(gz_file_path, 'wb')
            f_out.writelines(f_in)
            f_out.close()
            f_in.close()

            # Create a .tar.gz file for the file
            tar_file_name = file + '.tar.gz'
            with tarfile.open(tar_file_name, 'w:gz') as tar_file:
                print("Compressing: ", source_file_path)
                tar_file.add(source_file_path,
                             arcname=os.path.basename(source_file_path))

            # Upload the zip file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(tar_file_name)

            # Upload the zip file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(gz_file_name)

            os.remove(tar_file_name)
            os.remove(gz_file_name)

        if file.startswith('vkey.json') or file.startswith('email.wasm'):
            # Upload the zip file to the AWS bucket, overwriting any existing file with the same name
            upload_to_s3(file, dir)
