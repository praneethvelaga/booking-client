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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        bgcolor: '#f5f5f5',
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: '90%', sm: 600 },
          width: '100%',
          bgcolor: 'white',
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" gutterBottom align="center">
          Forgot Password
        </Typography>

        {step === 1 && (
          <Stack spacing={2} alignItems="center">
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Enter OTP"
                  fullWidth
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled
                />
              </Grid>
            </Grid>
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Button variant="contained" onClick={handleSendOtp} fullWidth>
                Send OTP
              </Button>
            </Box>
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={2} alignItems="center">
            <Grid container spacing={2} justifyContent="center" alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Enter OTP"
                  fullWidth
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button variant="contained" onClick={handleVerifyOtp} fullWidth>
                  Verify
                </Button>
              </Grid>
            </Grid>
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Button variant="contained" onClick={handleSendOtp} fullWidth>
                Resend OTP
              </Button>
            </Box>
          </Stack>
        )}

        {step === 3 && (
          <Stack spacing={2} alignItems="center">
            <Box sx={{ width: { xs: '100%', sm: '80%' } }}>
              <TextField
                label="Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '80%' } }}>
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '80%' } }}>
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Button variant="contained" onClick={handleResetPassword} fullWidth>
                Change Password
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default ForgotPassword;