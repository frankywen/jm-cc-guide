# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./cmd/server

# Runtime stage
FROM alpine:3.18

WORKDIR /app

# Install sqlite and ca-certificates
RUN apk add --no-cache sqlite-libs ca-certificates

# Copy binary from builder
COPY --from=builder /app/server .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Run the server
CMD ["./server"]
