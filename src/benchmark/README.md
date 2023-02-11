# How to run benchmarks
1. create a `<file_name>.eml` based on https://zkemail.xyz/.
2. create a `.env` file:
    ```
    BROWSERSTACK_USERNAME=
    BROWSERSTACK_ACCESS_KEY=
    AWS_ACCESS_KEY_ID=
    SECRET_ACCESS_KEY=
    SNARKJS_WEB_SITE=<website with snarkjs loaded>
    EMAIL_FILE_PATH=<file name>.eml
    ```
3. run `yarn run bench` from the project root
