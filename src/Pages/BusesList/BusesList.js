import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppAPI from "../../API";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function BusesList() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const location = useLocation();
  const searchParams = location.state || {}; // Default to empty object if state is undefined

  const from = searchParams.from || "";
  const to = searchParams.to || "";
  const date = searchParams.date || "";

  useEffect(() => {
    // Only redirect if no initial state and no previous search
    if (!from && !to && !date && !location.state?.error) {
      navigate("/homepage", { state: { error: "Please fill out all search fields!" } });
      return;
    }

    const fetchBuses = async () => {
      try {
        const tripData = { from, to, date };
        const result = await AppAPI.busesList.post(null, tripData);
        console.log(result);
        if (result.status === 200 && result.buses) {
          setBuses(result.buses);
        } else {
          setError(result.message || "Failed to fetch buses.");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong while fetching buses.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [from, to, date, navigate]);

  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
        <Typography mt={2}>Loading buses...</Typography>
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="sm">
        <Alert severity="error" sx={{ mt: 5 }}>{error}</Alert>
      </Container>
    );

  return (
    <Container sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box>
          <Box textAlign="" mt={4}>
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate("/homepage")}
              sx={{ color: "black" }}
            >
              <ArrowBackIcon sx={{ color: "black", mr: 1 }} />
              Back to Home
            </Button>
          </Box>
          <Box textAlign="center" mb={2}>
            <Typography variant="h5" gutterBottom>
              Available Buses
            </Typography>
            <Typography>From: {from}</Typography>
            <Typography>To: {to}</Typography>
            <Typography>Date: {date}</Typography>
          </Box>
        </Box>

        <Box mt={3}>
          {buses.length === 0 ? (
            <Typography textAlign="center">No buses available for this route and date.</Typography>
          ) : (
            buses.map((bus) => (
              <Box key={bus.bus_id} mb={2}>
                <Card elevation={3} sx={{ width: "100%" }}>
                  <CardContent
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {bus.starting_area} to {bus.destination_area}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mt={1} mb={1}>
                        <Box textAlign="center">
                          <Typography variant="body2" fontWeight="bold">
                            Departure
                          </Typography>
                          <Typography variant="body1">{bus.starting_time}</Typography>
                        </Box>

                        <Box
                          flexGrow={1}
                          height="3px"
                          borderBottom="5px dashed lightgray"
                          mx={6}
                        />

                        <Box textAlign="center">
                          <Typography variant="body2" fontWeight="bold">
                            Arrival
                          </Typography>
                          <Typography variant="body1">{bus.ending_time}</Typography>
                        </Box>
                      </Box>
                      <Typography>
                        <strong>Fare:</strong> ₹{bus.ticket_price}
                      </Typography>
                      <Typography>
                        <strong>Seats Available:</strong> {bus.number_of_seats}
                      </Typography>
                      <Typography>
                        <strong>Bus Type:</strong> {bus.bus_type}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "blue",
                        color: "white",
                        "&:hover": { backgroundColor: "#0039cb" },
                      }}
                      onClick={() =>
                        navigate("/view-seats", { state: { bus, from, to, date } })
                      }
                    >
                      Book your ticket now <ArrowForwardIcon sx={{ color: "white", ml: 1 }} />
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default BusesList;