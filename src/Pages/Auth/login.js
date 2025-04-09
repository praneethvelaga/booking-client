import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppAPI from '../../API';
import { saveUserState } from "./+state/loadUserState"; 
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Stack,
} from "@mui/material";
import APIConfig from '../../API/constants'; 
const HOSTNAME = APIConfig.hostname;

function Loginpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState(""); // Backend error message
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const navigate = useNavigate();

  // Redirect to register page
  const handleRegisterClick = () => {
    navigate("/register");
  };

  // Validate email and password
  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      setEmailError("Invalid email format");
      isValid = false;
    }

    if (!password.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/)) {
      setPasswordError("Password must be at least 6 characters, include 1 uppercase letter & 1 number.");
      isValid = false;
    }

    return isValid;
  };


  // Handle API authentication
  const doAuthenticate = (email, password) => {
    const formData = { email, password };
    console.log("HOSTNAME:", HOSTNAME);

    setLoading(true);
    setApiError("");
    setAlert(false);
    //console.log(formData);
  
    AppAPI.auth.post(null, formData)
      .then((result) => {
        if (result.status === 400) {
          setAlert(true);
          setAlertMessage(
            result.error === "Not a registered mobile number"
              ? "Your Mobile No. is Not Registered with us!"
              : "Your Password is Incorrect!"
          );
        } else if (result.token) {
          saveUserState({ token: result.token, user: result.user });
          //console.log("hi")
          // Navigate to the homepage after successful login
          navigate("/homepage");
        } else {
          setAlert(true);
          setAlertMessage("You are not Authorized!");
        }
      })
      .catch((e) => {
        console.log(e)
        setApiError("Something went wrong. Please try again.");
        console.error("Authentication error:", e);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  

  // Handle form submission
  const onSubmit = (e) => {
    e.preventDefault(); 
    setApiError("");
    setAlert(false);

    if (!validateForm()) {
      return;
    }

    if (email && password) {
      doAuthenticate(email, password);
    } else {
      setAlert(true);
      setAlertMessage("Please enter all fields to proceed.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5", 
      }}
    >
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          width: { xs: '90%', sm: '80%', md: '60%', lg: '45%', xl: '35%' },
          mt: { xs: 2, sm: 4, md: 5 },
          p: { xs: 2, sm: 3, md: 4 },
          boxShadow: 3,
          borderRadius: 2,
      }}
      >
        {/* Title */}
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>

        {/* Email Field */}
        <TextField
          fullWidth
          label="Email"
          type="email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          error={!!emailError}
          helperText={emailError}
          margin="normal"
        />

        {/* Password Field */}
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          error={!!passwordError}
          helperText={passwordError}
          margin="normal"
        />

        {/* API Error */}
        {apiError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {apiError}
          </Alert>
        )}

        {/* Alert Message */}
        {alert && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {alertMessage}
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 3, py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
        </Button>

        {/* Extra Links */}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Link
            component="button"
            variant="body2"
            disabled={loading}
            sx={{ textDecoration: "none" }}
          >
            Forgot Password?
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={handleRegisterClick}
            disabled={loading}
            sx={{ textDecoration: "none" }}
          >
            Register
          </Link>
        </Stack>
      </Box>
    </Box>
  );
}

export default Loginpage;