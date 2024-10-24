class CircuitBreaker {
  constructor(timeoutLimit) {
    this.failureCount = 0; // Count of consecutive failures
    this.maxFailures = 3; // Number of failures before tripping the circuit
    this.timeout = timeoutLimit * 3.5; // Timeout period to reset the breaker
    this.circuitOpen = false; // Is the circuit open (tripped)?
    this.lastFailureTime = null; // Time of the last failure
  }

  // Log the error and trip the circuit
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.maxFailures) {
      this.circuitOpen = true; // Trip the circuit
      console.log(
        `Circuit breaker tripped! Too many failures (Count: ${this.failureCount}).`
      );
    }
  }

  // Check if the circuit is open (tripped)
  isCircuitOpen() {
    if (this.circuitOpen && Date.now() - this.lastFailureTime >= this.timeout) {
      console.log("Circuit breaker reset. Closing circuit.");
      this.reset(); // Close the circuit after the timeout expires
    }

    return this.circuitOpen;
  }

  // Reset the circuit breaker
  reset() {
    this.circuitOpen = false;
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

export default CircuitBreaker;
