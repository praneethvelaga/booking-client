import React, { useState, useEffect } from 'react';
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
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import AppAPI from '../../API';

const PaymentForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { passengers, totalPrice, busId, selectedSeats, bus } = location.state || {};
  const [user] = useState(JSON.parse(localStorage.getItem('auth'))?.user || {});
  const [validationMessage, setValidationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [busDetails, setBusDetails] = useState(null);

  // Original ticket price from bus data
  const originalTicketPrice = bus?.ticket_price || 1000; // Fallback to 1000
  const numberOfTickets = selectedSeats?.length || 0;
  const originalTotalPrice = numberOfTickets * originalTicketPrice;
  const discountApplied = originalTotalPrice !== totalPrice;
  const totalDiscount = discountApplied ? originalTotalPrice - totalPrice : 0;

  // Fetch bus details
  const fetchBusDetails = async (busId) => {
    console.log('Fetching bus details for busId:', busId);
    try {
      const response = await AppAPI.buses.get(`${busId}`);
      console.log('Bus API Response:', response);
      const busData = response.bus[0];
      if (!busData || !busData.bus_id) {
        throw new Error('Invalid bus data received');
      }
      return {
        busNumber: busData.bus_number,
        startingPoint: busData.starting_area,
        endingPoint: busData.destination_area,
        startTime: busData.starting_time.slice(0, 5),
        endTime: busData.ending_time.slice(0, 5),
        journeyDuration: `${busData.journey_duration_hours} hours`,
      };
    } catch (error) {
      console.error('Error fetching bus details:', error);
      return {
        busNumber: 'N/A',
        startingPoint: bus?.starting_area || 'N/A',
        endingPoint: bus?.destination_area || 'N/A',
        startTime: 'N/A',
        endTime: 'N/A',
        journeyDuration: 'N/A',
      };
    }
  };

  // Book seats
  const bookSeats = async () => {
    if (!busId) {
      setValidationMessage('Missing bus ID.');
      console.log('busId:', busId);
      return false;
    }
    if (!passengers || passengers.length !== selectedSeats.length) {
      setValidationMessage('Number of passengers must match number of selected seats.');
      return false;
    }

    try {
      setLoading(true);
      const passengerNames = passengers.map((passenger) => passenger.name);
      const bookingData = {
        userId: user.id || 30,
        busId: busId,
        seatNumbers: selectedSeats,
        passengerName: passengerNames,
        EmployeeID: passengers.map((passenger) =>
          passenger.concessionType === 'rtc_employee' && passenger.isEmployeeVerified
            ? passenger.cardNumber
            : ''
        ),
      };
      console.log('Booking Data:', bookingData);

      const response = await AppAPI.BookingSeat.post(null, bookingData);
      console.log('Booking Response:', response);

      const details = await fetchBusDetails(busId);
      setBusDetails(details);
      setIsBooked(true);
      return true; // Return success flag
    } catch (error) {
      console.error('Error booking seats:', error);
      const errorMessage = error.message || 'Failed to book seats.';
      if (errorMessage.includes('Invalid request')) {
        setValidationMessage('Invalid request. Please ensure all fields are correct.');
      } else if (errorMessage.includes('Booking limit')) {
        setValidationMessage('Booking limit for today exceeded.');
      } else if (errorMessage.includes('already booked')) {
        setValidationMessage(errorMessage);
      } else {
        setValidationMessage(`Failed to book seats: ${error.error || 'Unknown error'}`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setValidationMessage(''); // Clear previous message before booking
    const bookingSuccess = await bookSeats();
    if (bookingSuccess) {
      setValidationMessage('Seats booked successfully. Payment processed.');
    }
  };

  const handleBackToPassengerForm = () => {
    navigate('/passenger-form', {
      state: { passengers, totalPrice, busId, selectedSeats, bus },
    });
  };

  // Validate input data
  if (!passengers || !totalPrice || !busId || !selectedSeats || !bus) {
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
              severity={validationMessage.includes('successfully') ? 'success' : 'error'}
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
                      <TableCell>Ticket Price</TableCell>
                      <TableCell>Discount Applied</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {passengers.map((passenger, index) => {
                      const discount = passenger.ticketPrice < originalTicketPrice
                        ? originalTicketPrice - passenger.ticketPrice
                        : 0;
                      return (
                        <TableRow key={index}>
                          <TableCell>{passenger.seatNo}</TableCell>
                          <TableCell>{passenger.name}</TableCell>
                          <TableCell>₹{passenger.ticketPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            {discount > 0
                              ? `₹${discount.toLocaleString()} (RTC Employee)`
                              : 'None'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2 }}>
                <Typography>
                  Original Price: {numberOfTickets} tickets * ₹{originalTicketPrice.toLocaleString()} = ₹{originalTotalPrice.toLocaleString()}
                </Typography>
                {discountApplied && (
                  <Typography sx={{ mt: 1 }}>
                    Total Discount: ₹{totalDiscount.toLocaleString()}
                  </Typography>
                )}
                <Typography sx={{ mt: 1, color: 'success.main', fontWeight: 'bold' }}>
                  Total Amount: ₹{totalPrice.toLocaleString()}
                </Typography>
              </Box>

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

              <Typography variant="h6">Bus Details</Typography>
              <Box sx={{ ml: 2 }}>
                <Typography>Bus Number: {busDetails?.busNumber || 'N/A'}</Typography>
                <Typography>
                  Starting Point: {busDetails?.startingPoint || bus?.starting_area || 'N/A'} at {busDetails?.startTime || 'N/A'}
                </Typography>
                <Typography>
                  Ending Point: {busDetails?.endingPoint || bus?.destination_area || 'N/A'} at {busDetails?.endTime || 'N/A'}
                </Typography>
                <Typography>Journey Duration: {busDetails?.journeyDuration || 'N/A'}</Typography>
              </Box>

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
                      <TableCell>Discount Applied</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {passengers.map((passenger, index) => {
                      const discount = passenger.ticketPrice < originalTicketPrice
                        ? originalTicketPrice - passenger.ticketPrice
                        : 0;
                      return (
                        <TableRow key={index}>
                          <TableCell>{passenger.seatNo}</TableCell>
                          <TableCell>{passenger.name}</TableCell>
                          <TableCell>{passenger.gender}</TableCell>
                          <TableCell>{passenger.age}</TableCell>
                          <TableCell>₹{passenger.ticketPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            {discount > 0
                              ? `₹${discount.toLocaleString()} (RTC Employee)`
                              : 'None'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2 }}>
                <Typography>Total Tickets: {numberOfTickets}</Typography>
                <Typography>
                  Original Price: {numberOfTickets} tickets * ₹{originalTicketPrice.toLocaleString()} = ₹{originalTotalPrice.toLocaleString()}
                </Typography>
                {discountApplied && (
                  <Typography sx={{ mt: 1 }}>
                    Total Discount: ₹{totalDiscount.toLocaleString()}
                  </Typography>
                )}
                <Typography sx={{ mt: 1, color: 'success.main', fontWeight: 'bold' }}>
                  Final Amount Paid: ₹{totalPrice.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/homepage')}
                >
                  Go to Home
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