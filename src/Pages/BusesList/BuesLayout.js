import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppAPI from "../../API";
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  Divider,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/system";
import { MdOutlineChair } from "react-icons/md";
import { GiSteeringWheel } from "react-icons/gi";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Styled component for seat boxes
const SeatBox = styled(Box)(({ theme, status, selected, isMobile }) => ({
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #ccc",
  borderRadius: "4px",
  cursor: status === "booked" ? "not-allowed" : "pointer",
  backgroundColor:
    status === "booked"
      ? "#f88c92"
      : selected
      ? "#32db32"
      : "#fff",
  "&:hover": {
    backgroundColor: status !== "booked" && !selected ? "#f0f0f0" : undefined,
  },
  transform: isMobile ? "rotate(90deg)" : "none",
}));

const Layout = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  const navigate = useNavigate();
  const location = useLocation();
  const { bus, from, to, date, selectedSeats: incomingSelectedSeats } = location.state || {};

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch bus data
  useEffect(() => {
    console.log('Layout received state:', location.state);
    if (!bus) {
      console.warn('No bus data provided, redirecting to /buses-list');
      navigate("/buses-list", { state: { error: "No bus data provided!", from, to, date } });
      return;
    }

    const fetchBusData = async () => {
      try {
        console.log("Bus ID:", bus.bus_id);
        const result = await AppAPI.buses.get(`${bus.bus_id}`);
        console.log("API Response:", result);
        if (result.status === 200) {
          setBookedSeats(result.booked_seats || []);
        } else {
          setError("Failed to fetch bus data.");
        }
      } catch (err) {
        console.error("Error fetching bus data:", err);
        setError("Something went wrong while fetching bus data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBusData();
    if (incomingSelectedSeats) {
      setSelectedSeats(incomingSelectedSeats);
    }
  }, [bus, navigate, incomingSelectedSeats, from, to, date]);

  const generateBusSeatData = () => {
    const totalSeats = bus.number_of_seats || 36;
    const seatsMinusThird = totalSeats - 1;
    const seatsPerRowBase = Math.floor(seatsMinusThird / 4);
    const extraSeats = seatsMinusThird % 4;

    const row1Length = seatsPerRowBase + (extraSeats > 0 ? 1 : 0);
    const row2Length = seatsPerRowBase + (extraSeats > 1 ? 1 : 0);
    const row4BaseLength = seatsPerRowBase + (extraSeats > 2 ? 1 : 0);
    const row4Length = Math.min(row4BaseLength - 1, seatsPerRowBase - 1);
    const row5Length = totalSeats - (row1Length + row2Length + 1 + row4Length);

    let seatCounter = 1;
    let oddDisplay = 1;
    let evenDisplay = 2;

    const row1 = Array.from({ length: row1Length }, () => {
      const seat = {
        id: seatCounter++,
        displayNumber: oddDisplay,
        status: bookedSeats.includes(oddDisplay) ? "booked" : "available",
        price: Number(bus.ticket_price),
      };
      oddDisplay += 2;
      return seat;
    });

    const row2 = Array.from({ length: row2Length }, () => {
      const seat = {
        id: seatCounter++,
        displayNumber: evenDisplay,
        status: bookedSeats.includes(evenDisplay) ? "booked" : "available",
        price: Number(bus.ticket_price),
      };
      evenDisplay += 2;
      return seat;
    });

    const row3 =
      seatCounter <= totalSeats
        ? [
            {
              id: seatCounter++,
              displayNumber: oddDisplay,
              status: bookedSeats.includes(oddDisplay) ? "booked" : "available",
              price: Number(bus.ticket_price),
            },
          ]
        : [];
    oddDisplay += 2;
    evenDisplay = row3[0]?.displayNumber + 1 || evenDisplay;

    const row4 = Array.from({ length: row4Length }, () => {
      const seat = {
        id: seatCounter++,
        displayNumber: oddDisplay,
        status: bookedSeats.includes(oddDisplay) ? "booked" : "available",
        price: Number(bus.ticket_price),
      };
      oddDisplay += 2;
      return seat;
    });

    const row5 = Array.from({ length: row5Length }, () => {
      const seat = {
        id: seatCounter++,
        displayNumber: evenDisplay,
        status: bookedSeats.includes(evenDisplay) ? "booked" : "available",
        price: Number(bus.ticket_price),
      };
      evenDisplay += 2;
      return seat;
    });

    return { row1, row2, row3, row4, row5 };
  };

  const { row1, row2, row3, row4, row5 } = bus ? generateBusSeatData() : {};

  const handleSeatClick = (seatId) => {
    const allSeats = [...row1, ...row2, ...row3, ...row4, ...row5];
    const seat = allSeats.find((s) => s.id === seatId);
    if (seat.status === "booked") return;

    const seatDisplayNumber = seat.displayNumber;
    setSelectedSeats((prev) => {
      if (prev.includes(seatDisplayNumber)) {
        return prev.filter((s) => s !== seatDisplayNumber);
      } else if (prev.length >= 10) {
        setShowError(true);
        return prev;
      } else {
        setShowError(false);
        return [...prev, seatDisplayNumber];
      }
    });
  };

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) {
      setShowError(true);
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user')) || {};
    const bookingDetails = {
      selectedSeats,
      userData,
      onetiketPrices: Number(bus.ticket_price),
      totalPrices: selectedSeats.length * Number(bus.ticket_price),
      busId: bus.bus_id,
      bus, // Ensure bus object is passed
    };
    console.log("Navigating to PassengerForm with:", bookingDetails);
    navigate("/passenger-form", { state: bookingDetails });
  };

  if (!bus) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Alert severity="error">No bus data provided!</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/buses-list", { state: { from, to, date } })}
          sx={{ mt: 2 }}
        >
          Back to Buses
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography mt={2}>Loading seat data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/buses-list", { state: { from, to, date } })}
          sx={{ mt: 2 }}
        >
          Back to Buses
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Grid
        container
        spacing={4}
        sx={{
          maxWidth: "1200px",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
        }}
      >
        {/* Seat Layout */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            justifyContent: "center",
            transform: isMobile ? "rotate(-90deg)" : "none",
            transformOrigin: "center",
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              bgcolor: "white",
              width: isMobile ? "auto" : "100%",
              maxWidth: isMobile ? "90vw" : "none",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body1" align="center" color="text.secondary">
                Click on available seats to reserve your seat.
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box>
                  <GiSteeringWheel
                    style={{
                      fontSize: "1.875rem",
                      color: "red",
                      transform: isMobile ? "rotate(90deg)" : "rotate(-90deg)",
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    borderLeft: "3px dashed #081c3a",
                    pl: 3,
                  }}
                >
                  {[row1, row2, row3, row4, row5].map((row, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: idx === 2 ? "flex-end" : "flex-end",
                      }}
                    >
                      {row.map((seat) => (
                        <SeatBox
                          key={seat.id}
                          status={seat.status}
                          selected={selectedSeats.includes(seat.displayNumber)}
                          onClick={() => handleSeatClick(seat.id)}
                          isMobile={isMobile}
                        >
                          <Typography
                            sx={{
                              transform: isMobile ? "rotate(0deg)" : "rotate(90deg)",
                              fontSize: "14px",
                            }}
                          >
                            {seat.displayNumber}
                          </Typography>
                          <MdOutlineChair
                            style={{
                              fontSize: "1.5rem",
                              transform: isMobile ? "rotate(0deg)" : "rotate(90deg)",
                              color:
                                seat.status === "booked"
                                  ? "white"
                                  : selectedSeats.includes(seat.displayNumber)
                                  ? "#32db32"
                                  : "#6b7280",
                            }}
                          />
                        </SeatBox>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Box>
              {showError && (
                <Typography color="error" align="center">
                  Cannot select more than 10 seats!
                </Typography>
              )}
              <Divider sx={{ my: 2, borderColor: "#e5e7eb" }} />
              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={2}
                justifyContent="center"
                alignItems="center"
              >
                {[
                  { icon: <MdOutlineChair />, text: "Available", color: "#6b7280" },
                  { icon: <MdOutlineChair />, text: "Booked", color: "#f88c92" },
                  { icon: <MdOutlineChair />, text: "Selected", color: "#32db32" },
                  {
                    icon: <RiMoneyRupeeCircleLine />,
                    text: `₹${bus.ticket_price}`,
                    color: "#000",
                  },
                ].map((item, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box component="span">
                      {React.cloneElement(item.icon, {
                        style: {
                          color: item.color,
                          fontSize: "1.5rem",
                          transform: isMobile ? "rotate(90deg)" : "rotate(-90deg)",
                        },
                      })}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Seat Selection Info */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#f9fafb",
              border: "1px solid #e5e7eb",
              width: "100%",
              maxWidth: isMobile ? "90vw" : "400px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Your Destination
            </Typography>
            <Box>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  From <Typography component="span">{bus.starting_area}</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  To <Typography component="span">{bus.destination_area}</Typography>
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Start time <Typography component="span">{bus.starting_time}</Typography>
                </Typography>
                <Divider sx={{ flex: 1, borderStyle: "dashed", borderColor: "#d4d4d4" }} />
                <Typography variant="body2" color="text.secondary">
                  End time <Typography component="span">{bus.ending_time}</Typography>
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" color="text.secondary">
                  Selected Seats
                </Typography>
                <Box
                  sx={{
                    bgcolor: "rgba(220, 10, 10, 0.2)",
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    color: "#8e2222",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                  }}
                >
                  Non-refundable
                </Box>
              </Stack>
              {selectedSeats.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                  {selectedSeats.map((seatNumber) => (
                    <Box
                      key={seatNumber}
                      sx={{
                        width: "2.25rem",
                        height: "2.25rem",
                        bgcolor: "rgba(229, 229, 229, 0.8)",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "medium",
                        color: "#44403c",
                        m: 0.5,
                      }}
                    >
                      {seatNumber}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="error" sx={{ mt: 1 }}>
                  No Seat Selected ....
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="h6" color="text.secondary">
                Fare Details
              </Typography>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ borderLeft: "1px dashed #a3a3d4", pl: 1, mt: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Basic Fare:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ₹{bus.ticket_price}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ borderLeft: "1px dashed #a3a3d4", pl: 1, mt: 1 }}
              >
                <Typography variant="body1" color="text.secondary">
                  Total Price <Typography component="span">(Including all taxes)</Typography>
                </Typography>
                <Typography variant="body1" color="success.main" fontWeight="medium">
                  ₹{selectedSeats.length * Number(bus.ticket_price)}
                </Typography>
              </Stack>
            </Box>

            <Stack spacing={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleConfirmBooking}
                disabled={selectedSeats.length === 0}
              >
                Confirm Booking
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/buses-list", { state: { from, to, date } })}
              >
                Back to Bus List
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Layout;