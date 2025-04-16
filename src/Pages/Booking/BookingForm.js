import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import debounce from 'lodash/debounce';
import AppAPI from '../../API';

const PassengerForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [passengers, setPassengers] = useState([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [calculatedTotalPrice, setCalculatedTotalPrice] = useState(0);
  const [usedEmployeeIds, setUsedEmployeeIds] = useState(new Set());

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("auth"));
    if (storedUser) {
      setUser(storedUser.user || {});
    }
  }, []);

  const { selectedSeats, userData, onetiketPrices, totalPrices, busId, bus, passengers: incomingPassengers } = location.state || {};
  const originalTicketPrice = Number(onetiketPrices) || 1000;

  // Log initial state to debug
  useEffect(() => {
    console.log('PassengerForm initial state:', location.state);
    console.log('Selected Seats:', selectedSeats, 'Bus ID:', busId, 'Bus:', bus);
  }, [selectedSeats, busId, bus, location.state]);

  const handleBackToLayout = () => {
    // Log state to debug
    console.log('Attempting to navigate back to Layout with state:', {
      selectedSeats,
      userData,
      onetiketPrices,
      totalPrices,
      busId,
      bus,
      from: bus?.starting_area || location.state?.from || '',
      to: bus?.destination_area || location.state?.to || '',
      date: location.state?.date || new Date().toISOString().split('T')[0],
    });

    // Check for missing data with fallbacks
    const safeSelectedSeats = selectedSeats || [];
    const safeBusId = busId || '';
    const safeBus = bus || { bus_id: busId, ticket_price: onetiketPrices }; // Fallback bus object

    if (!safeSelectedSeats.length) {
      console.error('selectedSeats is missing or empty:', selectedSeats);
      setValidationMessage('Selected seats data is missing.');
      return;
    }
    if (!safeBusId) {
      console.error('busId is missing:', busId);
      setValidationMessage('Bus ID is missing.');
      return;
    }

    const stateToPass = {
      selectedSeats: safeSelectedSeats,
      userData: userData || {},
      onetiketPrices: onetiketPrices || 1000,
      totalPrices: totalPrices || (safeSelectedSeats.length * (onetiketPrices || 1000)),
      busId: safeBusId,
      bus: safeBus,
      from: safeBus.starting_area || location.state?.from || '',
      to: safeBus.destination_area || location.state?.to || '',
      date: location.state?.date || new Date().toISOString().split('T')[0],
    };
    navigate('/view-seats', { state: stateToPass });
  };

  useEffect(() => {
    // Only redirect to /buses-list on initial load if data is completely missing
    if (!location.state || (!selectedSeats && !busId && !bus)) {
      console.warn('Redirecting to /buses-list due to missing initial data');
      navigate('/buses-list', { state: { error: 'Missing required data!' } });
      return;
    }

    // If passengers data is passed back from PaymentForm, use it; otherwise, initialize
    if (incomingPassengers && incomingPassengers.length > 0) {
      setPassengers(incomingPassengers);
      setCalculatedTotalPrice(totalPrices || incomingPassengers.reduce((sum, p) => sum + p.ticketPrice, 0));
      const verifiedEmployeeIds = new Set(
        incomingPassengers
          .filter(p => p.concessionType === 'rtc_employee' && p.isEmployeeVerified)
          .map(p => p.cardNumber)
      );
      setUsedEmployeeIds(verifiedEmployeeIds);
      setIsValidated(true);
    } else {
      const initialFormData = (selectedSeats || []).map((seat) => ({
        seatNo: seat,
        mobileNo: userData?.phonenumber || user?.phonenumber || '',
        email: userData?.email || user?.email || '',
        name: userData?.name || user?.name || '',
        gender: (userData?.gender || user?.gender || '').toLowerCase(), // Fix case sensitivity
        age: '',
        concessionType: '',
        cardNumber: '',
        employeeRelation: '',
        isEmployeeVerified: false,
        ticketPrice: originalTicketPrice,
        validationMessage: '',
      }));
      setPassengers(initialFormData);
      setCalculatedTotalPrice(Number(totalPrices) || Number((selectedSeats || []).length * originalTicketPrice));
    }
  }, [selectedSeats, userData, onetiketPrices, totalPrices, busId, navigate, originalTicketPrice, incomingPassengers, user, bus, location.state]);

  const validateEmployeeId = async (cardNumber, name, relation) => {
    const params = {
      cardNumber,
      ...(relation === 'me' ? { EmployeeName: name } : { EmployeeWifeName: name }),
    };

    try {
      setLoading(true);
      console.log('Validating employee ID with params:', params);
      const response = await AppAPI.EmpValidation.post(null, params);
      console.log('Validation Response:', response);

      const result = response && typeof response === 'object'
        ? {
            valid: response.valid === true,
            message: response.message || 'Employee found'
          }
        : { valid: false, message: 'Invalid response from server' };

      console.log('Parsed Validation Result:', result);
      return result;
    } catch (error) {
      console.error('Error validating employee ID:', error);
      return {
        valid: false,
        message: error.message || 'Error validating Employee ID',
      };
    } finally {
      setLoading(false);
    }
  };

  const debouncedValidateEmployeeId = useCallback(
    debounce(async (cardNumber, name, relation, index) => {
      if (cardNumber && passengers[index]?.concessionType === 'rtc_employee' && relation) {
        const result = await validateEmployeeId(cardNumber, name, relation);
        console.log('Debounced Validation Result for index', index, ':', result);
        setPassengers((prevData) => {
          const newPassengers = [...prevData];
          const isAlreadyUsed = usedEmployeeIds.has(cardNumber) && prevData.some((p, i) => i !== index && p.cardNumber === cardNumber && p.isEmployeeVerified && p.employeeRelation !== relation);

          newPassengers[index] = {
            ...newPassengers[index],
            isEmployeeVerified: result.valid && !isAlreadyUsed,
            ticketPrice: result.valid && !isAlreadyUsed ? originalTicketPrice * 0.7 : originalTicketPrice,
            validationMessage: result.valid ? (isAlreadyUsed ? 'Employee ID already used for this relation' : 'Employee found') : result.message || 'Unknown error',
          };

          if (result.valid && !isAlreadyUsed) {
            setUsedEmployeeIds((prev) => new Set(prev).add(cardNumber));
          }

          console.log(`Passenger ${index} updated - isEmployeeVerified: ${newPassengers[index].isEmployeeVerified}, ticketPrice: ${newPassengers[index].ticketPrice}`);
          return newPassengers;
        });
      }
    }, 500),
    [originalTicketPrice, usedEmployeeIds, passengers]
  );

  const handleChange = (index, e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        return;
      }
    }

    if (name === 'age') {
      if (!/^\d*$/.test(value)) {
        return;
      }
    }

    setPassengers((prevData) => {
      const updatedPassengers = [...prevData];
      const prevCardNumber = updatedPassengers[index]?.cardNumber;

      updatedPassengers[index] = {
        ...updatedPassengers[index],
        [name]: value,
        isEmployeeVerified: name === 'concessionType' && value !== 'rtc_employee' ? false : updatedPassengers[index].isEmployeeVerified,
        ticketPrice: name === 'concessionType' && value !== 'rtc_employee' ? originalTicketPrice : updatedPassengers[index].ticketPrice,
        validationMessage: name === 'concessionType' && value !== 'rtc_employee' ? '' : updatedPassengers[index].validationMessage,
      };

      if (name === 'cardNumber' && prevCardNumber && updatedPassengers[index].isEmployeeVerified && prevCardNumber !== value) {
        setUsedEmployeeIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(prevCardNumber);
          return newSet;
        });
      }

      return updatedPassengers;
    });
    setValidationMessage('');
    setIsValidated(false);

    if (name === 'cardNumber' || name === 'name' || name === 'employeeRelation') {
      const { cardNumber, name: passengerName, employeeRelation } = passengers[index] || {};
      if (passengers[index]?.concessionType === 'rtc_employee' && cardNumber && employeeRelation) {
        debouncedValidateEmployeeId(cardNumber, passengerName, employeeRelation, index);
      }
    }
  };

  const handleSharedFieldChange = (field, value) => {
    setPassengers((prevData) =>
      prevData.map((passenger) => ({
        ...passenger,
        [field]: value,
      }))
    );
    setValidationMessage('');
    setIsValidated(false);
  };

  useEffect(() => {
    if (passengers.length > 0) {
      const newTotalPrice = passengers.reduce((sum, passenger) => sum + passenger.ticketPrice, 0);
      setCalculatedTotalPrice(newTotalPrice);
      console.log('Calculated Total Price:', newTotalPrice);
    }
  }, [passengers]);

  const handleVerify = async () => {
    let isValid = true;
    let message = '';
    const tempUsedEmployeeIds = new Set();
    let updatedPassengers = [...passengers];

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];

      if (!passenger.gender) {
        isValid = false;
        message = `Please select a gender for passenger ${i + 1}.`;
        break;
      }
      if (!passenger.name.trim()) {
        isValid = false;
        message = `Please enter a name for passenger ${i + 1}.`;
        break;
      }
      if (!/^[a-zA-Z\s]+$/.test(passenger.name.trim())) {
        isValid = false;
        message = `Name for passenger ${i + 1} must contain only alphabetic characters.`;
        break;
      }
      if (!passenger.age || Number(passenger.age) <= 5 || Number(passenger.age) >= 110) {
        isValid = false;
        message = `Please enter a valid age (greater than 5 and less than 110) for passenger ${i + 1}.`;
        break;
      }
      if (!passenger.seatNo) {
        isValid = false;
        message = `Seat number is missing for passenger ${i + 1}.`;
        break;
      }
      if (!passenger.concessionType) {
        isValid = false;
        message = `Please select a concession type for passenger ${i + 1}.`;
        break;
      }

      if (passenger.concessionType === 'rtc_employee') {
        if (!passenger.cardNumber) {
          isValid = false;
          message = `Please provide an Employee ID for passenger ${i + 1} (RTC Employee concession).`;
          break;
        }
        if (!passenger.employeeRelation) {
          isValid = false;
          message = `Please select a relation (Self or Wife) for passenger ${i + 1} (RTC Employee concession).`;
          break;
        }

        const result = await validateEmployeeId(passenger.cardNumber, passenger.name, passenger.employeeRelation);
        console.log('HandleVerify Validation Result for index', i, ':', result);
        const isAlreadyUsed = tempUsedEmployeeIds.has(passenger.cardNumber) && passengers.some((p, j) => j !== i && p.cardNumber === passenger.cardNumber && p.isEmployeeVerified && p.employeeRelation !== passenger.employeeRelation);

        updatedPassengers[i] = {
          ...updatedPassengers[i],
          isEmployeeVerified: result.valid && !isAlreadyUsed,
          ticketPrice: result.valid && !isAlreadyUsed ? originalTicketPrice * 0.7 : originalTicketPrice,
          validationMessage: result.valid ? (isAlreadyUsed ? 'Employee ID already used for this relation' : 'Employee found') : result.message || 'Unknown error',
        };

        if (result.valid && !isAlreadyUsed) {
          tempUsedEmployeeIds.add(passenger.cardNumber);
        } else if (!result.valid || isAlreadyUsed) {
          isValid = false;
          message = result.valid ? `Employee ID already used for this relation for passenger ${i + 1}` : (result.message || `Employee ID not verified for passenger ${i + 1}.`);
          break;
        }
      }
    }

    if (isValid) {
      setPassengers(updatedPassengers);
      setUsedEmployeeIds(tempUsedEmployeeIds);
      setIsValidated(true);
      setValidationMessage('All details verified successfully.');
    } else {
      setPassengers(updatedPassengers);
      setIsValidated(false);
      setValidationMessage(message);
    }
  };

  const handleProceedToPayment = () => {
    if (!isValidated) {
      setValidationMessage('Please verify passenger details before proceeding.');
      return;
    }
  
    console.log('Navigating to payment with:', { passengers, totalPrice: calculatedTotalPrice, busId, selectedSeats, bus });
    navigate('/payment', {
      state: { passengers, totalPrice: calculatedTotalPrice, busId, selectedSeats, bus },
    });
  };

  if (passengers.length === 0) {
    return null;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Passenger Details
          </Typography>

          {validationMessage && (
            <Alert
              severity={
                validationMessage.includes('not available') ||
                validationMessage.includes('Please') ||
                validationMessage.includes('not verified') ||
                validationMessage.includes('already used') ||
                validationMessage.includes('Invalid') ||
                validationMessage.includes('missing') ||
                validationMessage.includes('must contain only') ||
                validationMessage.includes('Cannot navigate')
                  ? 'error'
                  : 'success'
              }
              sx={{ mb: 2 }}
            >
              {validationMessage}
            </Alert>
          )}

          <Box component="form">
            <TextField
              label="Mobile No."
              type="tel"
              name="mobileNo"
              value={user.phonenumber || ''}
              onChange={(e) => handleSharedFieldChange('mobileNo', e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
            />

            <TextField
              label="Email Id"
              type="email"
              name="email"
              value={user.email || ''}
              onChange={(e) => handleSharedFieldChange('email', e.target.value)}
              fullWidth
              required
              sx={{ mb: 4 }}
            />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Gender</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Seat No.</TableCell>
                    <TableCell>Concession Type</TableCell>
                    <TableCell>Card Number</TableCell>
                    <TableCell>Relation</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ticket Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {passengers.map((passenger, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <FormControl fullWidth required>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            name="gender"
                            value={passenger.gender || ''} // Default to empty string if undefined
                            onChange={(e) => handleChange(index, e)}
                          >
                            <MenuItem value="">Select One</MenuItem>
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="text"
                          name="name"
                          value={passenger.name}
                          onChange={(e) => handleChange(index, e)}
                          fullWidth
                          required
                          inputProps={{ pattern: "[a-zA-Z\\s]*" }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="text"
                          name="age"
                          value={passenger.age}
                          onChange={(e) => handleChange(index, e)}
                          fullWidth
                          required
                          inputProps={{ pattern: "\\d*" }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          name="seatNo"
                          value={passenger.seatNo}
                          disabled
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth required>
                          <InputLabel>Concession Type</InputLabel>
                          <Select
                            name="concessionType"
                            value={passenger.concessionType}
                            onChange={(e) => handleChange(index, e)}
                          >
                            <MenuItem value="">Select One</MenuItem>
                            <MenuItem value="general">GENERAL PUBLIC</MenuItem>
                            <MenuItem value="senior">SENIOR CITIZEN</MenuItem>
                            <MenuItem value="rtc_employee">RTC RETIRED EMPLOYEE</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="text"
                          name="cardNumber"
                          value={passenger.cardNumber}
                          onChange={(e) => handleChange(index, e)}
                          disabled={passenger.concessionType !== 'rtc_employee'}
                          placeholder={passenger.concessionType === 'rtc_employee' ? 'e.g: APSRTC175-XXX' : 'N/A'}
                          fullWidth
                          required={passenger.concessionType === 'rtc_employee'}
                        />
                      </TableCell>
                      <TableCell>
                        {passenger.concessionType === 'rtc_employee' ? (
                          <FormControl fullWidth required>
                            <InputLabel>Relation</InputLabel>
                            <Select
                              name="employeeRelation"
                              value={passenger.employeeRelation}
                              onChange={(e) => handleChange(index, e)}
                            >
                              <MenuItem value="">Select One</MenuItem>
                              <MenuItem value="me">Self</MenuItem>
                              <MenuItem value="wife">Wife</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {passenger.validationMessage && (
                          <Typography color={passenger.isEmployeeVerified ? 'success.main' : 'error.main'}>
                            {passenger.validationMessage}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        ₹{passenger.ticketPrice.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3 }}>
              <Typography>One Ticket Price: ₹{originalTicketPrice.toLocaleString()}</Typography>
              <Typography>Total Price: ₹{calculatedTotalPrice.toLocaleString()}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button variant="outlined" color="secondary" onClick={handleBackToLayout}>
                Back to Layout Page
              </Button>
              <Box>
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleVerify}
                  disabled={loading}
                  sx={{ mr: 2 }}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleProceedToPayment}
                  disabled={loading || !isValidated}
                >
                  Proceed to Payment
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PassengerForm;