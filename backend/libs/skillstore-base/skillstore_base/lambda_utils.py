#!/usr/bin/env python
# -*- coding: UTF-8 -*-


import os
import logging
from io import BytesIO
from json import dumps
from hashlib import md5
from logging import Logger
from urllib.parse import unquote


def configure_logger(function_name: str) -> Logger:
    root_logger = logging.getLogger()
    if len(root_logger.handlers) > 0:
        root_logger.setLevel(logging.INFO)
    else:
        logging.basicConfig(level=logging.INFO)
    return logging.getLogger(function_name)


logger: Logger = configure_logger(__name__)


def missing_param(param_name: str, status_code: int = 500) -> dict:
    return {
        'statusCode': status_code,
        'body': {
            'message': f"{param_name} Not Provided"
        }
    }


def no_data_found(attribute: str, status_code: int = 204) -> dict:
    return {
        'statusCode': status_code,
        'body': {
            'message': f"{attribute} Not Found"
        }
    }


def missing_file(param_name: str, status_code: int = 404) -> dict:
    return {
        'statusCode': status_code,
        'body': {
            'message': f"{param_name} File Not Found"
        }
    }


def calculate_md5_binary(binary_data: bytes, use_hyphen: bool = False) -> str | None:
    # -----------------------------------------------------------------------------
    # Purpose:  Binary Function required for bytes data
    # Issue:    https://github.com/Maryville-University-DLX/transcriptiq/issues/863
    # Updated:  22-May-2025
    # -----------------------------------------------------------------------------
    if not binary_data or not isinstance(binary_data, bytes):
        logger.error("Input must be a non-empty bytes object")
        return None

    md5_hash = md5()
    bytestream = BytesIO(binary_data)
    bytestream.seek(0)

    for byte_block in iter(lambda: bytestream.read(4096), b""):
        md5_hash.update(byte_block)

    value = md5_hash.hexdigest()

    if not use_hyphen:
        return value

    return f"{value[:2]}-{value[2:]}"


def calculate_md5(entity_name: str, use_hyphen: bool = False) -> str | None:

    if not entity_name or not isinstance(entity_name, str) or not len(entity_name):
        logger.error(f"Input Text is Invalid")
        return None

    entity_name = entity_name.lower().strip()
    if not len(entity_name):
        logger.error(f"Input Text is Zero-Length")
        return None

    bytestream: BytesIO = BytesIO(unquote(entity_name).encode('utf-8'))
    md5_hash = md5()
    bytestream.seek(0)
    for byte_block in iter(lambda: bytestream.read(4096), b""):
        md5_hash.update(byte_block)

    value: str = md5_hash.hexdigest()

    if not use_hyphen:
        return value

    return f"{value[:2]}-{value[2:]}"


def write_event(*, logger: Logger, s3_client: any, event: dict[str, any], lambda_name: str, log_info_enabled: bool = True, bucket_name: str = "mtranscriptiq") -> None:

    event_hash: str = calculate_md5(entity_name=dumps(event), use_hyphen=True)
    s3_path: str = f"events/{lambda_name}/{event_hash[:2]}/{event_hash}.json"

    s3_client.put_object(
        Key=s3_path,
        Bucket=bucket_name,
        Body=dumps(event, default=str, indent=4),
    )

    if log_info_enabled:
        logger.info(
            f"Event Written to S3: Bucket: {bucket_name}, Key: {s3_path}"
        )
