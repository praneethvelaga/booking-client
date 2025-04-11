import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AppAPI from '../../API';

const PaymentForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { passengers, totalPrice, busId, selectedSeats, userData } = location.state || {};
  const [user] = useState(JSON.parse(localStorage.getItem("auth"))?.user || {});
  const [validationMessage, setValidationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [busDetails, setBusDetails] = useState(null);

  // Calculate original total price (before discounts)
  const originalTicketPrice = passengers[0]?.ticketPrice || 500; // Default to 500 from API
  const originalTotalPrice = selectedSeats.length * originalTicketPrice;
  const numberOfTickets = selectedSeats.length;

  // Fetch bus details using AppAPI.buses.get
  const fetchBusDetails = async (busId) => {
    console.log('Attempting to fetch bus details for busId:', busId); // Debug log
    try {
      const response = await AppAPI.buses.get(`${busId}`); // Use the specific buses endpoint
      console.log('Bus API Response:', response);

      // Adjust for fetch-based response: directly access response.bus
      const bus = response.bus[0]; // Access the first bus object from the bus array
      if (!bus || !bus.bus_id) {
        throw new Error('Invalid bus data received');
      }

      return {
        busNumber: bus.bus_number,
        startingPoint: bus.starting_area,
        endingPoint: bus.destination_area,
        startTime: bus.starting_time.slice(0, 5), // "08:00:00" -> "08:00"
        endTime: bus.ending_time.slice(0, 5),     // "12:00:00" -> "12:00"
        journeyDuration: `${bus.journey_duration_hours} hours`,
      };
    } catch (error) {
      console.error('Error fetching bus details:', error.message, error.response ? error.response : 'No response data');
      return {
        busNumber: 'N/A',
        startingPoint: 'N/A',
        endingPoint: 'N/A',
        startTime: 'N/A',
        endTime: 'N/A',
        journeyDuration: 'N/A',
      };
    }
  };

  const bookSeats = async () => {
    if (!busId) {
      setValidationMessage('Missing bus ID.');
      console.log('busId:', busId);
      return false;
    }

    if (passengers.length !== selectedSeats.length) {
      setValidationMessage('Number of passengers must match number of selected seats.');
      return false;
    }

    try {
      setLoading(true);
      const passengerNames = passengers.map(passenger => passenger.name);

      const bookingData = {
        userId: user.id || 30,
        busId: busId,
        seatNumbers: selectedSeats,
        passengerName: passengerNames,
        EmployeeID: passengers.map(passenger => {
          const empId = passenger.concessionType === 'rtc_employee' && passenger.isEmployeeVerified 
            ? passenger.cardNumber 
            : "";
          console.log(`Passenger ${passenger.name} - isEmployeeVerified: ${passenger.isEmployeeVerified}, empId: ${empId}`);
          return empId;
        }),
      };
      console.log('Booking Data being sent to backend:', bookingData);

      const response = await AppAPI.BookingSeat.post(null, bookingData);
      console.log('Booking Response:', response);

      // Fetch bus details after successful booking
      const details = await fetchBusDetails(busId);
      setBusDetails(details);
      setIsBooked(true);
      return true;
    } catch (error) {
      console.error('Error booking seats:', error);
      const errorMessage = error.message || 'Failed to book seats.';
      
      if (errorMessage.includes('Invalid request')) {
        setValidationMessage('Invalid request. Please ensure all required fields are filled correctly.');
      } else if (errorMessage.includes('Booking limit')) {
        setValidationMessage('Booking limit for today exceeded.');
      } else if (errorMessage.includes('already booked')) {
        setValidationMessage(errorMessage);
      } else if (errorMessage.includes('Failed to book seats')) {
        setValidationMessage(`Failed to book seats: ${error.error || 'Unknown error'}`);
      } else {
        setValidationMessage(errorMessage);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setValidationMessage(''); // Clear previous message
    const bookingSuccess = await bookSeats();
    if (bookingSuccess) {
      setValidationMessage('Seats booked successfully. Payment processed.'); // Set once
    }
  };

  const handleBackToPassengerForm = () => {
    navigate('/passenger-form', {
      state: { passengers, totalPrice, busId, selectedSeats, userData },
    });
  };

  if (!passengers || !totalPrice || !busId || !selectedSeats) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Missing required data for payment!</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {isBooked ? 'Booking Confirmation' : 'Payment Details'}
          </Typography>

          {validationMessage && (
            <Alert
              severity={
                validationMessage.includes('Failed') ||
                validationMessage.includes('Invalid') ||
                validationMessage.includes('limit') ||
                validationMessage.includes('already booked')
                  ? 'error'
                  : 'success'
              }
              sx={{ mb: 2 }}
            >
              {validationMessage}
            </Alert>
          )}

          {!isBooked ? (
            // Pre-booking view
            <Box sx={{ mt: 2 }}>
              <Typography>Bus ID: {busId}</Typography>
              <Typography>Number of Tickets: {numberOfTickets}</Typography>

              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Seat Number</TableCell>
                      <TableCell>Passenger Name</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {passengers.map((passenger, index) => (
                      <TableRow key={index}>
                        <TableCell>{passenger.seatNo}</TableCell>
                        <TableCell>{passenger.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography sx={{ mt: 2 }}>
                Ticket Prices: ({numberOfTickets} tickets * ₹{originalTicketPrice.toLocaleString()} = ₹{originalTotalPrice.toLocaleString()})
              </Typography>

              {originalTotalPrice !== totalPrice && (
                <Typography sx={{ mt: 1 }}>
                  Offer Applied: RTC Employee Discount = ₹{(originalTotalPrice - totalPrice).toLocaleString()}
                </Typography>
              )}

              <Typography sx={{ mt: 1, color: 'success.main', fontWeight: 'bold' }}>
                Total Amount: ₹{totalPrice.toLocaleString()}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button variant="outlined" color="secondary" onClick={handleBackToPassengerForm}>
                  Back to Passenger Form
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConfirmPayment}
                  disabled={loading || isBooked}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </Box>
            </Box>
          ) : (
            // Post-booking confirmation view
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <span role="img" aria-label="check">✅</span> {validationMessage}
                </Typography>
              </Alert>

              {/* Bus Details */}
              <Typography variant="h6">Bus Details</Typography>
              <Box sx={{ ml: 2 }}>
                <Typography>Bus Number: {busDetails?.busNumber || 'N/A'}</Typography>
                <Typography>Starting Point: {busDetails?.startingPoint || 'N/A'} at {busDetails?.startTime || 'N/A'}</Typography>
                <Typography>Ending Point: {busDetails?.endingPoint || 'N/A'} at {busDetails?.endTime || 'N/A'}</Typography>
                <Typography>Journey Duration: {busDetails?.journeyDuration || 'N/A'}</Typography>
              </Box>

              {/* Ticket and Passenger Details */}
              <Typography variant="h6" sx={{ mt: 2 }}>Ticket Booking Details</Typography>
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Seat Number</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Ticket Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {passengers.map((passenger, index) => (
                      <TableRow key={index}>
                        <TableCell>{passenger.seatNo}</TableCell>
                        <TableCell>{passenger.name}</TableCell>
                        <TableCell>{passenger.gender}</TableCell>
                        <TableCell>{passenger.age}</TableCell>
                        <TableCell>₹{passenger.ticketPrice.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary */}
              <Typography sx={{ mt: 2 }}>
                Total Tickets: {numberOfTickets}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                Total Original Price: ₹{originalTotalPrice.toLocaleString()}
              </Typography>
              <Typography sx={{ mt: 1, color: 'success.main', fontWeight: 'bold' }}>
                Final Amount Paid: ₹{totalPrice.toLocaleString()}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/homepage')}
                >
                  GO TO HOME
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentForm;