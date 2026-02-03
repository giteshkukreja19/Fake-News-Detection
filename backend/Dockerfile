FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train model on build if not already present
RUN python ml/train.py

EXPOSE 5000

CMD ["gunicorn", "app:app", "-w", "4", "-b", "0.0.0.0:5000", "--timeout", "120"]
