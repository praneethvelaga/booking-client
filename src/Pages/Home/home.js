import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  TextField,
  Paper,
  Avatar,
  Container,
  Box,
} from "@mui/material";
import {
  Home as HomeIcon,
  Cancel as CancelIcon,
  Map as MapIcon,
  CalendarToday as CalendarIcon,
  Menu as MenuIcon,
  AccountCircle as UserIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AppAPI from "../../API";

function HomeComponent() {
  const [user, setUser] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileView, setProfileView] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [fromList, setFromList] = useState([]);
  const [toList, setToList] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("auth"));
    if (storedUser) {
      setUser(storedUser.user);
    }
  }, []);

  const handleConstituenciesRequest = (query, type) => {
    AppAPI.Constituencies.get(`?que=${query}`)
      .then((result) => {
        if (type === "from") {
          setFromList(result || []);
        } else if (type === "to") {
          setToList(result || []);
        }
      })
      .catch((e) => {
        console.error(e);
        if (type === "from") {
          setFromList([]);
        } else if (type === "to") {
          setToList([]);
        }
      });
  };

  useEffect(() => {
    if (from !== "") {
      handleConstituenciesRequest(from, "from");
      setShowFromSuggestions(true);
    } else {
      setFromList([]);
      setShowFromSuggestions(false);
    }
  }, [from]);

  useEffect(() => {
    if (to !== "") {
      handleConstituenciesRequest(to, "to");
      setShowToSuggestions(true);
    } else {
      setToList([]);
      setShowToSuggestions(false);
    }
  }, [to]);

  const handleFromSuggestionClick = (suggestion) => {
    setFrom(suggestion.constituency_name);
    setFromList([]);
    setShowFromSuggestions(false);
  };

  const handleToSuggestionClick = (suggestion) => {
    setTo(suggestion.constituency_name);
    setToList([]);
    setShowToSuggestions(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth"); // Only used for auth, not data passing
    navigate("/login");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Validate that all fields are filled
    if (from && to && date) {
      // Pass data to BusesList via navigation state, NOT localStorage
      navigate("/buses-list", { state: { from, to, date } });
    } else {
      alert("Please fill in all fields: From, To, and Date.");
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Bus Booking
          </Typography>
          <IconButton color="inherit" onClick={() => setProfileView(!profileView)}>
            <UserIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          {[
            { text: "Home", icon: <HomeIcon />, path: "/home" },
            { text: "Cancel Ticket", icon: <CancelIcon />, path: "/cancel" },
            { text: "Track Service", icon: <MapIcon />, path: "/track" },
            { text: "Time Table", icon: <CalendarIcon />, path: "/timetable" },
          ].map((item) => (
            <ListItem button key={item.text} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {profileView && (
        <Paper sx={{ position: "absolute", right: 10, top: 70, padding: 2, width: 250 }}>
          <Avatar sx={{ width: 80, height: 80, margin: "auto" }} />
          <Typography align="center">{user?.fullname || "User"}</Typography>
          <Typography align="center">{user?.email || "user@example.com"}</Typography>
          <Button variant="contained" fullWidth color="error" onClick={handleLogout}>
            <LogoutIcon /> Logout
          </Button>
        </Paper>
      )}

      <Container sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: "100%" }}>
          <Typography variant="h5" align="center" gutterBottom>
            Book Your Ticket
          </Typography>
          <form onSubmit={handleFormSubmit}>
            {/* From Field with Suggestions */}
            <Box sx={{ position: "relative" }}>
              <TextField
                label="From"
                variant="outlined"
                fullWidth
                margin="normal"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              {from && showFromSuggestions && (
                <Paper
                  sx={{
                    position: "absolute",
                    zIndex: 3,
                    width: "100%",
                    maxHeight: 200,
                    overflowY: "auto",
                    mt: 1,
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <List dense>
                    {fromList.length > 0 ? (
                      fromList.map((suggestion, index) => (
                        <ListItem
                          key={index}
                          button={true}
                          onClick={() => handleFromSuggestionClick(suggestion)}
                          sx={{ py: 0.5 }}
                        >
                          <ListItemText
                            primary={
                              suggestion && suggestion.constituency_name
                                ? `${suggestion.constituency_name} (${suggestion.district}, ${suggestion.state})`
                                : "Invalid suggestion"
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Data not found" />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              )}
            </Box>

            {/* To Field with Suggestions */}
            <Box sx={{ position: "relative" }}>
              <TextField
                label="To"
                variant="outlined"
                fullWidth
                margin="normal"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              {to && showToSuggestions && (
                <Paper
                  sx={{
                    position: "absolute",
                    zIndex: 3,
                    width: "100%",
                    maxHeight: 200,
                    overflowY: "auto",
                    mt: 1,
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <List dense>
                    {toList.length > 0 ? (
                      toList.map((suggestion, index) => (
                        <ListItem
                          key={index}
                          button={true}
                          onClick={() => handleToSuggestionClick(suggestion)}
                          sx={{ py: 0.5 }}
                        >
                          <ListItemText
                            primary={
                              suggestion && suggestion.constituency_name
                                ? `${suggestion.constituency_name} (${suggestion.district}, ${suggestion.state})`
                                : "Invalid suggestion"
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Data not found" />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              )}
            </Box>

            <TextField
              label="Depart On"
              type="date"
              name="date"
              variant="outlined"
              fullWidth
              margin="normal"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: today }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Check Availability
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default HomeComponent;