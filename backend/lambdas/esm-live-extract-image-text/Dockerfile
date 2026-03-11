FROM lambda-base:3.11-arm64

# Tesseract 5.2.0 ARM64 pre-built binaries (not in amzn2-core; downloaded from
# github.com/bweigel/aws-lambda-tesseract-layer feat/arm64-support branch)
RUN python3 -c "\
import urllib.request, os; \
base='https://raw.githubusercontent.com/bweigel/aws-lambda-tesseract-layer/feat/arm64-support/ready-to-use/amazonlinux-2-aarch64'; \
urllib.request.urlretrieve(base+'/bin/tesseract', '/usr/local/bin/tesseract'); \
os.chmod('/usr/local/bin/tesseract', 0o755); \
os.makedirs('/usr/local/lib', exist_ok=True); \
[urllib.request.urlretrieve(base+'/lib/'+lib, '/usr/local/lib/'+lib) for lib in ['libtesseract.so.5','liblept.so.5','libtiff.so.5','libjpeg.so.62','libwebp.so.4','libpng15.so.15','libjbig.so.2.0','libgomp.so.1']]; \
os.makedirs('/usr/local/share/tessdata', exist_ok=True); \
[urllib.request.urlretrieve(base+'/tesseract/share/tessdata/'+l+'.traineddata', '/usr/local/share/tessdata/'+l+'.traineddata') for l in ['eng','osd']]"

ENV TESSDATA_PREFIX=/usr/local/share/tessdata
ENV LD_LIBRARY_PATH=/usr/local/lib

COPY lib/*.whl ${LAMBDA_TASK_ROOT}/
# Pillow: image preprocessing; pytesseract: Python wrapper for tesseract binary
RUN pip install --no-cache-dir ${LAMBDA_TASK_ROOT}/*.whl \
    pytesseract \
    Pillow

COPY lambda_function.py ${LAMBDA_TASK_ROOT}
CMD [ "lambda_function.handler" ]
