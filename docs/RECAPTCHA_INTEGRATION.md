# reCAPTCHA Integration for Checkout

## Overview

The checkout page now includes reCAPTCHA v3 integration to enhance security and combat fraud, bots, and automated attacks. This implementation uses Google's invisible reCAPTCHA that runs in the background without requiring user interaction.

## Features

### Security Benefits
- **Fraud Prevention**: Blocks automated bots and scripts
- **Rate Limiting**: Prevents rapid-fire checkout attempts
- **Score-based Verification**: Uses Google's risk scoring (0.0-1.0)
- **Action-specific Verification**: Different actions for different contexts

### User Experience
- **Invisible**: No user interaction required
- **Fast**: Verification happens in the background
- **Non-intrusive**: Doesn't interrupt the checkout flow
- **Development-friendly**: Automatically disabled in development mode

## Implementation

### Frontend Integration

The checkout page includes reCAPTCHA in the following way:

```tsx
// Security Verification Section
<div className="p-6 border-b border-gray-200">
  <div className="mb-4">
    <h3 className="text-sm font-medium text-gray-900 mb-2">Security Verification</h3>
    <p className="text-xs text-gray-600 mb-3">
      This helps protect against fraud and automated attacks
    </p>
  </div>
  <ReCaptcha
    action="checkout"
    onVerify={(token) => setRecaptchaToken(token)}
  />
</div>
```

### Backend Verification

The checkout API verifies the reCAPTCHA token before processing:

```typescript
// Verify reCAPTCHA token
const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'checkout', 0.5);
if (!recaptchaResult.success) {
  return NextResponse.json({ 
    error: "Security verification failed. Please try again.",
    details: "reCAPTCHA verification failed",
    recaptchaError: recaptchaResult.error
  }, { status: 403 });
}
```

### Configuration

#### Environment Variables

Required environment variables:

```env
# reCAPTCHA v3 Site Key (public)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here

# reCAPTCHA v3 Secret Key (private)
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

#### Score Thresholds

- **Default threshold**: 0.5 (medium security)
- **High-value orders**: Consider lowering to 0.3 for stricter verification
- **Guest checkout**: Consider raising to 0.7 for more lenient verification

## Security Features

### Score-based Verification

reCAPTCHA v3 returns a score from 0.0 to 1.0:
- **1.0**: Very likely a human
- **0.0**: Very likely a bot

The system rejects scores below the configured threshold.

### Action-specific Verification

Different actions are used for different contexts:
- `checkout`: For payment processing
- `register`: For user registration
- `contact_form`: For contact forms
- `feedback_form`: For feedback forms

### Development Mode

reCAPTCHA verification is automatically disabled in development mode:
- No API calls to Google
- Always returns success
- Allows for easy testing

## Error Handling

### Frontend Errors

```typescript
// Check if reCAPTCHA token is available
if (process.env.NODE_ENV !== 'development' && !recaptchaToken) {
  toast.error("Please complete the security verification");
  return;
}
```

### Backend Errors

```typescript
// Handle reCAPTCHA verification failures
if (response.status === 403 && data.error === "Security verification failed. Please try again.") {
  trackError('recaptcha_error', data.details || 'Security verification failed');
  toast.error("Security verification failed. Please refresh the page and try again.");
  setRecaptchaToken(""); // Reset for retry
}
```

## Monitoring and Analytics

### Tracking Events

The system tracks reCAPTCHA-related events:
- `recaptcha_error`: When verification fails
- `recaptcha_success`: When verification succeeds
- `recaptcha_score_low`: When score is below threshold

### Logging

Server-side logging includes:
- Verification success/failure
- Score values
- Action verification
- Error details

## Best Practices

### Security
1. **Never expose secret keys** in client-side code
2. **Use HTTPS** in production
3. **Monitor scores** and adjust thresholds as needed
4. **Log suspicious activity** for manual review

### Performance
1. **Load reCAPTCHA script** asynchronously
2. **Cache tokens** when possible
3. **Handle timeouts** gracefully
4. **Provide fallbacks** for network issues

### User Experience
1. **Clear messaging** about security verification
2. **Graceful error handling** with retry options
3. **Visual indicators** of security status
4. **Accessibility considerations** for screen readers

## Troubleshooting

### Common Issues

1. **Token Missing**
   - Check if reCAPTCHA script loaded properly
   - Verify site key configuration
   - Check browser console for errors

2. **Verification Fails**
   - Check secret key configuration
   - Verify action matches expected value
   - Check score threshold settings

3. **Development Mode Issues**
   - Ensure NODE_ENV is set correctly
   - Check that development bypass is working

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will log reCAPTCHA verification responses to the console.

## Future Enhancements

### Planned Features
1. **Adaptive thresholds** based on user behavior
2. **Multi-factor verification** for high-risk transactions
3. **Machine learning integration** for better fraud detection
4. **Real-time monitoring** dashboard

### Integration Opportunities
1. **Stripe Radar** integration
2. **Custom fraud scoring** algorithms
3. **Behavioral analysis** tools
4. **Device fingerprinting** enhancement

---

*This documentation covers the current reCAPTCHA implementation. For questions or issues, please refer to the troubleshooting section or contact the development team.* 