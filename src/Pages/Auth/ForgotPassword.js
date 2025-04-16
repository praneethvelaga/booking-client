import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Stack, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AppAPI from '../../API';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      const response = await AppAPI.emailVerification.post(null, { email });
      if (response.status === 200) {
        alert('OTP sent to your email.');
        setStep(2);
      } else {
        alert(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      alert(err.message || 'Failed to send OTP');
      console.error(err);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await AppAPI.otpVerification.post(null, { email, otp });
      if (response.success) {
        setStep(3);
      } else {
        alert(response.message || 'Invalid OTP');
      }
    } catch (err) {
      alert(err.message || 'Error verifying OTP');
      console.error(err);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      const response = await AppAPI.passwordReset.patch(null, { email, password: newPassword });
      if (response.status === 200) {
        alert('Password reset successful!');
        setEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        navigate('/login');
      } else {
        alert(response.message || 'Failed to reset password');
      }
    } catch (err) {
      alert(err.message || 'Failed to reset password');
      console.error(err);
    }
  };

  return (
    <Box maxWidth={600} mx="auto" mt={5}>
      <Typography variant="h5" gutterBottom>
        Forgot Password
      </Typography>

      {step === 1 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Enter OTP"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled
              />
            </Grid>
          </Grid>
          <Button variant="contained" onClick={handleSendOtp}>
            Send OTP
          </Button>
        </Stack>
      )}

      {step === 2 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Enter OTP"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </Grid>
            <Grid item xs={2} display="flex" alignItems="center">
              <Button variant="contained" onClick={handleVerifyOtp}>
                Verify
              </Button>
            </Grid>
          </Grid>
          <Button variant="contained" onClick={handleSendOtp}>
            Resend OTP
          </Button>
        </Stack>
      )}

      {step === 3 && (
        <Stack spacing={2}>
          <TextField
            label="Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button variant="contained" onClick={handleResetPassword}>
            Change Password
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default ForgotPassword;