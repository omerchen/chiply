import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import CasinoIcon from "@mui/icons-material/Casino";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: "Home", path: "/", icon: <HomeIcon /> },
    { text: "Clubs", path: "/clubs", icon: <GroupsIcon /> },
  ];

  const drawer = (
    <List>
      {menuItems.map((item) => (
        <ListItemButton
          key={item.text}
          onClick={() => {
            navigate(item.path);
            if (isMobile) {
              handleDrawerToggle();
            }
          }}
          selected={location.pathname === item.path}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ bgcolor: "#673ab7" }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Chiply
          </Typography>
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  startIcon={item.icon}
                  sx={{
                    backgroundColor:
                      location.pathname === item.path
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent",
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={onLogout} edge="end">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawer}
      </Drawer>
      <Toolbar />
    </>
  );
};

export default Navbar;
