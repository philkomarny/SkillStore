#!/usr/bin/env python
# -*- coding: UTF-8 -*-


import os
from io import StringIO
from csv import DictWriter
from logging import Logger
from json import loads, dumps
from urllib.parse import unquote
from io import BytesIO, StringIO
from botocore.exceptions import ClientError, BotoCoreError


def list_json_files(*, logger: Logger, s3_client: any, folder_path: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq')):

    # Ensure folder_path ends with a slash
    if not folder_path.endswith('/'):
        folder_path += '/'

    logger.info(
        f"🪵 [list_json_files] Listing JSON files in s3://{bucket_name}/{folder_path}")

    response = s3_client.list_objects_v2(
        Bucket=bucket_name,
        Prefix=folder_path
    )

    json_files = [
        obj['Key']
        for obj in response.get('Contents', [])
        if obj['Key'].endswith('.json') and obj['Key'] != folder_path
    ]

    logger.info(
        f"✅ [list_json_files] Loaded {len(json_files)} JSON file(s) from {folder_path}: {dumps(json_files)}"
    )

    return json_files


def write_csv(*, logger: Logger, s3_client: any, file_key: str, records: list[dict], bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), content_type: str = "text/tab-separated-values") -> bool:
    """Helper function to write a tab-delimited CSV file to S3"""
    try:
        logger.info(
            f"🪵 [write_csv] Writing file to S3: s3://{bucket_name}/{file_key}")

        # Create an in-memory buffer for CSV data
        csv_buffer = StringIO()

        # Extract headers from the first record if records exist
        if records:
            headers = records[0].keys()

            writer = DictWriter(
                csv_buffer,
                fieldnames=headers,
                delimiter='\t'
            )

            writer.writeheader()
            writer.writerows(records)
            logger.debug(
                f"🧾 [write_csv] Wrote {len(records)} record(s) with headers: {list(headers)}")

        else:
            logger.warning("⚠️ [write_csv] No records to write to CSV.")

        # Upload the CSV content to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=csv_buffer.getvalue(),
            ContentType=content_type
        )

        logger.info(f"✅ [write_csv] File written successfully: {file_key}")
        return True

    except ClientError as e:
        logger.error(
            f"❌ [write_csv] Error writing file to S3 ({file_key}): {str(e)}")
        raise e


def list_s3_files(*, logger: Logger, s3_client: any, s3_prefix: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), sort_by_most_recent: bool = True, log_info_enabled: bool = True, log_file_paths: bool = False) -> list[str]:
    """Helper function to list files in an S3 path, with support for pagination and optional sorting by most recent"""
    try:

        if log_info_enabled:
            logger.info(
                f"🪵 [list_s3_files] Checking S3 path: s3://{bucket_name}/{s3_prefix}")

        files = []
        continuation_token = None

        while True:
            if continuation_token:
                response = s3_client.list_objects_v2(
                    Bucket=bucket_name,
                    Prefix=s3_prefix,
                    ContinuationToken=continuation_token
                )
            else:
                response = s3_client.list_objects_v2(
                    Bucket=bucket_name,
                    Prefix=s3_prefix
                )

            contents = response.get('Contents', [])

            files.extend([
                file for file in contents
                if file['Key'] != s3_prefix
                and file['Key'] != s3_prefix + "/"
            ])

            if log_info_enabled:
                logger.info(
                    f"📦 [list_s3_files] Retrieved {len(contents)} file(s); Total so far: {len(files)}"
                )

            if response.get('IsTruncated'):
                continuation_token = response.get('NextContinuationToken')
            else:
                break

        if log_info_enabled:
            logger.info(
                f"✅ [list_s3_files] Found {len(files)} file(s) in {s3_prefix}")

        if sort_by_most_recent:
            files.sort(key=lambda x: x['LastModified'], reverse=True)
            logger.debug(
                "🕒 [list_s3_files] Sorted by LastModified (most recent first)")

        seen = set()
        unique_keys = []
        for file in files:
            key = file['Key']
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)

        if log_info_enabled and len(unique_keys) != len(files):
            logger.info(
                f"🧹 [list_s3_files] Deduplicated {len(files)} → {len(unique_keys)} file(s)"
            )

        if log_file_paths:
            logger.info(f"🪶 [list_s3_files] File Paths: {dumps(unique_keys)}")

        return unique_keys

    except Exception as e:
        logger.error(
            f"❌ [list_s3_files] Error listing files in {s3_prefix}: {str(e)}")
        return []


def read_json(*, logger: Logger, s3_client: any, key: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), raise_file_not_found: bool = True, log_info_enabled: bool = True) -> dict | list | None:
    try:
        logger.debug(f"🪵 [read_json] Reading file: s3://{bucket_name}/{key}")
        obj = s3_client.get_object(Bucket=bucket_name, Key=unquote(key))
        json_data = obj['Body'].read().decode('utf-8')
        logger.debug(
            f"✅ [read_json] Successfully read {len(json_data)} bytes from {key}")
        return loads(json_data)

    except Exception as e:
        if raise_file_not_found:
            logger.error(f"❌ [read_json] Failed to read {key}: {e}")
            raise
        elif log_info_enabled:
            logger.info(f"ℹ️ [read_json] Cache not found: {key}")
            pass


def write_json(*, logger: Logger, s3_client: any, data: list | dict, s3_path: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), indent_json: bool = False, log_info_enabled: bool = True) -> str:

    def get_body() -> str:
        if isinstance(data, str):
            return data
        if indent_json:
            return dumps(data, default=str, indent=4)
        return dumps(data, default=str)

    s3_client.put_object(
        Body=get_body(),
        Bucket=bucket_name,
        Key=s3_path
    )

    if log_info_enabled:
        logger.info(
            f"✅ [write_json] File written to S3: s3://{bucket_name}/{s3_path}"
        )

    return s3_path


def write_text(*, logger: Logger, s3_client: any, data: str, s3_path: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), log_info_enabled: bool = True) -> str:

    s3_client.put_object(
        Bucket=bucket_name,
        Key=s3_path,
        Body=data.encode('utf-8')
    )

    if log_info_enabled:
        logger.info(
            f"🪶 [write_text] Wrote text file to: s3://{bucket_name}/{s3_path}")

    return s3_path

def read_text(*, logger: Logger, s3_client: any, s3_path: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), log_info_enabled: bool = True, raise_file_not_found: bool = True) -> str | None:
    try:

        s3_object = s3_client.get_object(Bucket=bucket_name, Key=s3_path)

        if log_info_enabled:
            logger.info(
                f"✅ [read_text] Retrieved object: s3://{bucket_name}/{s3_path}"
            )

        return s3_object['Body'].read().decode('utf-8')

    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            if raise_file_not_found:
                logger.error(f"❌ [read_text] S3 key does not exist: {s3_path}")
            else:
                logger.info(f"🧩 [read_text] S3 key does not exist: {s3_path}")
        elif error_code == 'AccessDenied':
            logger.error(f"🚫 [read_text] Access denied: {s3_path}")
        else:
            logger.error(
                f"⚠️ [read_text] ClientError ({error_code}) for {s3_path}: {e}")
        return None

    except BotoCoreError as e:
        logger.error(f"💥 [read_text] BotoCoreError: {e}")
        return None

    except UnicodeDecodeError as e:
        logger.error(f"🧩 [read_text] Decode error for {s3_path}: {e}")
        return None

    except Exception as e:
        logger.error(f"❗ [read_text] Unexpected error reading {s3_path}: {e}")
        return None


def check_file_exists(*, logger: Logger, s3_client: any, s3_path: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), log_info_enabled: bool = True) -> bool:
    """Helper function to check if a file exists in S3"""

    try:
        if log_info_enabled:
            logger.info(
                f"🪵 [check_file_exists] Checking: s3://{bucket_name}/{s3_path}")

        s3_client.head_object(Bucket=bucket_name, Key=s3_path)

        if log_info_enabled:
            logger.info(f"✅ [check_file_exists] File exists: {s3_path}")

        return True

    except ClientError as e:
        if e.response['Error']['Code'] == "404":
            if log_info_enabled:
                logger.info(f"❌ [check_file_exists] File not found: {s3_path}")
            return False
        else:
            logger.error(f"⚠️ [check_file_exists] Error: {str(e)}")
            raise e


def delete_file_from_s3(*, logger: Logger, s3_client: any, file_key: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), log_info_enabled: bool = True) -> bool:
    """Helper function to delete a single file from S3."""
    try:
        if log_info_enabled:
            logger.info(
                f"🪵 [delete_file_from_s3] Deleting: s3://{bucket_name}/{file_key}"
            )

        s3_client.delete_object(Bucket=bucket_name, Key=file_key)

        if log_info_enabled:
            logger.info(f"✅ [delete_file_from_s3] Deleted: {file_key}")

        return True

    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchKey':
            logger.warning(
                f"⚠️ [delete_file_from_s3] File not found (already deleted?): {file_key}")
        else:
            logger.error(
                f"❌ [delete_file_from_s3] ClientError deleting {file_key}: {e}")
        return False

    except Exception as e:
        logger.error(
            f"💥 [delete_file_from_s3] Unexpected error deleting {file_key}: {e}")
        return False


def delete_files_from_s3(*, logger: Logger, s3_client: any, file_keys: list[str], bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), log_info_enabled: bool = True) -> int:
    """Helper function to delete multiple files from S3. Returns the count of successfully deleted files."""
    success_count = 0

    for file_key in file_keys:
        if delete_file_from_s3(s3_client=s3_client, logger=logger, file_key=file_key, bucket_name=bucket_name):
            success_count += 1

    if log_info_enabled:
        logger.info(
            f"🧹 [delete_files_from_s3] Deleted {success_count}/{len(file_keys)} file(s).")

    return success_count


def read_bytestream(*, logger: Logger, s3_client: any, key: str, bucket_name: str = os.getenv("BUCKET_NAME", 'mtranscriptiq'), log_info_enabled: bool = True) -> BytesIO:
    """
    Reads an object from S3 and returns its content as a BytesIO stream.
    """
    try:
        if log_info_enabled:
            logger.info(
                f"🪵 [read_bytestream] Fetching: s3://{bucket_name}/{key}")

        obj = s3_client.get_object(Bucket=bucket_name, Key=unquote(key))
        logger.debug(
            f"✅ [read_bytestream] Read {obj['ContentLength']} bytes from {key}")
        return BytesIO(obj['Body'].read())

    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == "NoSuchKey":
            logger.error(
                f"❌ [read_bytestream] File not found: s3://{bucket_name}/{key}")
            raise FileNotFoundError(f"File not found: {key}")
        else:
            logger.error(
                f"⚠️ [read_bytestream] ClientError for key {key}: {e}")
            raise

    except Exception as e:
        logger.error(
            f"💥 [read_bytestream] Unexpected error reading {key}: {e}")
        raise
