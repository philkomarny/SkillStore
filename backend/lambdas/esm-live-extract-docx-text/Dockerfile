FROM lambda-base:3.11-arm64

COPY lib/*.whl ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir ${LAMBDA_TASK_ROOT}/*.whl \
    python-docx \
    python-pptx

COPY lambda_function.py ${LAMBDA_TASK_ROOT}
CMD [ "lambda_function.handler" ]
