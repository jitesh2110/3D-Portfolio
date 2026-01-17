import React from 'react';

const PortfolioPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const closePopup = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div style={overlayStyle} onClick={closePopup}>
            <div style={popupStyle}>
                <iframe
                    src="/portfolio2d/index.html"
                    title="2D Portfolio"
                    style={iframeStyle}
                    scrolling="no"
                />
            </div>
        </div>
    );
};

export default PortfolioPopup;

/* ================= STYLES ================= */

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'transparent', // ✅ CLEAR background (no overlay)
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const popupStyle = {
    width: '60%',
    height: '80%',
    backgroundColor: '#000',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
};

const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    overflow: 'hidden',
    pointerEvents: 'auto',
};
