import React, { useState } from 'react';
import {useNavigate } from 'react-router-dom';
import AppAPI from '../../API';
import {
    Box,
    Button,
    TextField,
    Typography,
    InputLabel,
    Alert,
    Link,
    Stack,
    MenuItem,
    Container,
    Select
} from '@mui/material';

function RegistrationPage(){
    // fullname, dateofbirth, gender, email, phonenumber, password

    const [fullname,setFullname] = useState("");
    const [email,setEmail] = useState("");
    const [gender,setGender] = useState("");
    const [phonenumber, setPhonenumber] = useState("");
    const [password, setPassword] = useState("");
    const [dateofbirth, setDateofbirth] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    // Alert
    const [alert, setAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    //Error
    const [errors, setErrors] = useState({});
    // navigation to Login page 
    const navigate = useNavigate(); 
    const handleLoginClick = () => {
        navigate("/login");
      };


    const validation =()=>{
        let isValid = true;
        let newError ={};

        if(!fullname.trim()) newError.fullname = "Full Name is required";
        if (!dateofbirth) newError.dob = "Date of birth is required";
        if (!gender) newError.gender = "Select a gender";
        if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
        newError.email = "Invalid email format";
        if (!phonenumber.match(/^[0-9]{10}$/))
        newError.phone = "Invalid phone number (10 digits required)";
        if (!password.match(/^(?=.*[A-Z])(?=.*\d).{6,}$/))
        newError.password =
            "Password must be at least 6 characters, include 1 uppercase letter & 1 number";
        if (password !== confirmPassword)
        newError.confirmPassword = "Passwords do not match";

        //seting error message
        setErrors(newError);
        return Object.keys(newError).length ===0;
    }
    const handleSubmit= (e)=>{
        e.preventDefault();

        if(validation()){
            DoRegisterTheNewUser(fullname, dateofbirth, gender, email, phonenumber, password)
        }
    }
    const DoRegisterTheNewUser =(fullname, dateofbirth, gender, email, phonenumber, password)=>{
        const data = {fullname, dateofbirth, gender, email, phonenumber, password};
        console.log(data)

        setLoading(true);
        setAlert(false);

        AppAPI.register.post(null,data)
        .then((result)=>{
            if(result.status === 400){
                setAlert(true);
                setAlertMessage( "User registration failed" )
            }else if(result.status === 500){
                setAlertMessage( "Failed to registerrr" )
            }
             else {
                setAlert(true);
                setAlertMessage("User registered successfully");
                
                setTimeout(() => {
                    navigate("/login");
                }, 2000); // Redirects after 2 seconds
            }
        })
        .catch((err)=>{
            console.log(err)
        })
    }
    return (
            <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
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
                    <Alert severity={alertMessage.includes("success") ? "success" : "error"} sx={{ mb: 2 }}>
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
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                            margin="normal"
                            required
                            error={!!errors.email}
                            helperText={errors.email}
                            disabled={loading}
                        />
                        <TextField
                            fullWidth
                            label="Mobile Number"
                            name="phonenumber"
                            type="number"
                            value={phonenumber}
                            onChange={(e)=>setPhonenumber(e.target.value)}
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
                            onChange={(e)=>setDateofbirth(e.target.value)}
                            margin="normal"
                            required
                            error={!!errors.dateofbirth}
                            helperText={errors.dateofbirth}
                            disabled={loading}
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
                            onChange={(e)=>setPassword(e.target.value)}
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
                            onChange={(e)=>setConfirmPassword(e.target.value)}
                            margin="normal"
                            required
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                            disabled={loading}
                        />
                        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                            Register
                        </Button>
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                                  <Link
                                    component="button"
                                    variant="body2"
                                    onClick={handleLoginClick}
                                    sx={{ textDecoration: "none" }}>
                                    <span>Click here to</span> login  
                                  </Link>
                                </Stack>
                    </form>
                </Box>
            </Container>
        );
}
export default RegistrationPage;