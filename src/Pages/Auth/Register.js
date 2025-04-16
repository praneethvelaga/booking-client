import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppAPI from '../../API';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link,
  Stack,
  MenuItem,
  Container,
  Grid,
} from '@mui/material';

function RegistrationPage() {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [phonenumber, setPhonenumber] = useState('');
  const [password, setPassword] = useState('');
  const [dateofbirth, setDateofbirth] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!fullname.trim()) newErrors.fullname = 'Full Name is required';
    if (!dateofbirth) newErrors.dateofbirth = 'Date of birth is required';
    if (!gender) newErrors.gender = 'Select a gender';
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      newErrors.email = 'Invalid email format';
    if (!phonenumber.match(/^[0-9]{10}$/))
      newErrors.phonenumber = 'Invalid phone number (10 digits required)';
    if (!password.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/))
      newErrors.password =
        'Password must be at least 6 characters, include 1 uppercase letter & 1 number';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (showOtp && !otpVerified)
      newErrors.otp = 'Please verify OTP before submitting';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      setErrors({ ...errors, email: 'Invalid email format' });
      return;
    }

    setLoading(true);
    setAlert(false);

    try {
      const response = await AppAPI.emailVerification.post(null, { email });
      if (response.status === 200) {
        setAlert(true);
        setAlertMessage('OTP sent to your email.');
        setShowOtp(true);
      } else {
        setAlert(true);
        setAlertMessage(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setAlert(true);
      setAlertMessage(err.message || 'Failed to send OTP');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (/^[0-9]{0,6}$/.test(value)) {
      setOtp(value);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setAlert(true);
      setAlertMessage('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setAlert(false);

    try {
      const response = await AppAPI.otpVerification.post(null, { email, otp });
      if (response.success) {
        setAlert(true);
        setAlertMessage('OTP verified successfully');
        setOtpVerified(true);
      } else {
        setAlert(true);
        setAlertMessage(response.message || 'Invalid OTP');
      }
    } catch (err) {
      setAlert(true);
      setAlertMessage(err.message || 'Error verifying OTP');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      DoRegisterTheNewUser(fullname, dateofbirth, gender, email, phonenumber, password);
    }
  };

  const DoRegisterTheNewUser = (fullname, dateofbirth, gender, email, phonenumber, password) => {
    const data = { fullname, dateofbirth, gender, email, phonenumber, password };

    setLoading(true);
    setAlert(false);

    AppAPI.register
      .post(null, data)
      .then((result) => {
        if (result.status === 400) {
          setAlert(true);
          setAlertMessage('User registration failed');
        } else if (result.status === 500) {
          setAlert(true);
          setAlertMessage('Failed to register');
        } else {
          setAlert(true);
          setAlertMessage('User registered successfully');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      })
      .catch((err) => {
        setAlert(true);
        setAlertMessage('Error during registration');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Container
      maxWidth="md"
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
    >
      <Box
        sx={{
          width: { xs: '90%', sm: '80%', md: '60%', lg: '50%', xl: '40%' },
          mt: { xs: 2, sm: 4, md: 5 },
          p: { xs: 2, sm: 3, md: 4 },
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" gutterBottom textAlign="center">
          Registration Form
        </Typography>
        {alert && (
          <Alert severity={alertMessage.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>
            {alertMessage}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="fullname"
            onChange={(e) => setFullname(e.target.value)}
            value={fullname}
            margin="normal"
            required
            error={!!errors.fullname}
            helperText={errors.fullname}
            disabled={loading}
          />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading || otpVerified}
              />
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="contained"
                onClick={handleSendOtp}
                disabled={loading || !email || otpVerified}
                sx={{ mt: 2 }}
              >
                Send OTP
              </Button>
            </Grid>
          </Grid>
          {showOtp && (
            <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  inputProps={{ maxLength: 6 }}
                  error={!!errors.otp}
                  helperText={errors.otp}
                  disabled={loading || otpVerified}
                />
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpVerified}
                >
                  Verify
                </Button>
              </Grid>
            </Grid>
          )}
          <TextField
            fullWidth
            label="Mobile Number"
            name="phonenumber"
            type="text"
            value={phonenumber}
            onChange={(e) => setPhonenumber(e.target.value)}
            margin="normal"
            required
            error={!!errors.phonenumber}
            helperText={errors.phonenumber}
            disabled={loading}
          />
          <TextField
            fullWidth
            name="dateofbirth"
            type="date"
            value={dateofbirth}
            onChange={(e) => setDateofbirth(e.target.value)}
            margin="normal"
            required
            error={!!errors.dateofbirth}
            helperText={errors.dateofbirth}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            select
            label="Gender"
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            margin="normal"
            required
            error={!!errors.gender}
            helperText={errors.gender}
            disabled={loading}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading || !otpVerified}
          >
            Register
          </Button>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={handleLoginClick}
              sx={{ textDecoration: 'none' }}
            >
              <span>Click here to</span> login
            </Link>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}

export default RegistrationPage;