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
import { Event as EventIcon } from "@mui/icons-material";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { User } from "../types/User";

interface NavbarProps {
  onLogout: () => void;
  user: User;
}

const NavButton = styled.button`
  padding: 12px 24px;
`;

const Navbar: React.FC<NavbarProps> = ({ onLogout, user }) => {
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
    { text: "Sessions", path: "/sessions", icon: <EventIcon /> },

    ...(user.systemRole === "admin"
      ? [
          {
            text: "Admin Panel",
            path: "/admin",
            icon: <AdminPanelSettingsIcon />,
          },
        ]
      : []),
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
      <ListItemButton onClick={onLogout}>
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </List>
  );

  const handleLogoClick = () => {
    navigate("/");
  };

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
          <Box
            component="div"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={handleLogoClick}
          >
            <img
              src="/Logo_Horiz.svg"
              alt="Chiply"
              style={{ height: "32px" }}
            />
          </Box>
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
                    px: 3,
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          {!isMobile && (
            <Tooltip title="Logout">
              <IconButton color="inherit" onClick={onLogout} edge="end">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
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
