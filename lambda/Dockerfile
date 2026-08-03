FROM public.ecr.aws/lambda/python:3.14

WORKDIR ${LAMBDA_TASK_ROOT}

RUN dnf install -y \
    mesa-libGL \
    wget \
    && dnf clean all

COPY requirements.txt .

RUN pip install -r requirements.txt

# Create numba cache directory
RUN mkdir -p /tmp/numba_cache


# Numba environment variables
ENV NUMBA_CACHE_DIR=/tmp/numba_cache
ENV NUMBA_NUM_THREADS=1
ENV NUMBA_DISABLE_JIT=1

# Copy function code
COPY . .

RUN wget https://jawsight-public-model-storage-473280638005-ap-south-1-an.s3.ap-south-1.amazonaws.com/u2net_human_seg.onnx \
    -O models/u2net_human_seg.onnx

# Set U2NET_HOME so rembg uses the local model
ENV U2NET_HOME=${LAMBDA_TASK_ROOT}/models


CMD [ "app.lambda_handler" ]