 let savedLocations = [];
        let filteredLocations = [];

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            loadLocations();
            updateLocationSelects();
            setupEventListeners();
        });

        // Load saved locations from localStorage
        function loadLocations() {
            const storedLocations = localStorage.getItem('rideAppLocations');
            if (storedLocations) {
                savedLocations = JSON.parse(storedLocations);
                filteredLocations = [...savedLocations];
                renderSavedLocations();
            } else {
                filteredLocations = [];
            }
        }

        // Save locations to localStorage
        function saveLocations() {
            localStorage.setItem('rideAppLocations', JSON.stringify(savedLocations));
        }

        // Filter locations by search term
        function filterLocations(searchTerm) {
            if (!searchTerm || searchTerm.trim() === '') {
                filteredLocations = [...savedLocations];
            } else {
                searchTerm = searchTerm.toLowerCase();
                filteredLocations = savedLocations.filter(location => 
                    location.name.toLowerCase().includes(searchTerm) || 
                    location.address.toLowerCase().includes(searchTerm)
                );
            }
            
            renderSavedLocations();
        }

        // Render the saved locations in the UI
        function renderSavedLocations() {
            const savedLocationsEl = document.getElementById('savedLocations');
            
            if (filteredLocations.length === 0) {
                let message = "No saved locations yet";
                if (savedLocations.length > 0) {
                    message = "No locations match your search";
                }
                
                savedLocationsEl.innerHTML = `
                    <div class="empty-state" id="noLocationsMsg">
                        <i class="fas fa-map"></i>
                        <div class="empty-state-text">${message}</div>
                    </div>
                `;
                return;
            }
            
            let locationsHTML = '';
            filteredLocations.forEach((location, index) => {
                const originalIndex = savedLocations.findIndex(l => l.name === location.name && l.address === location.address);
                locationsHTML += `
                    <div class="location-item">
                        <div>
                            <div class="location-name">${location.name}</div>
                            <div class="location-address">${location.address}</div>
                        </div>
                        <button class="delete-btn" onclick="deleteLocation(${originalIndex})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            
            savedLocationsEl.innerHTML = locationsHTML;
            updateLocationSelects();
        }

        // Update the dropdown selects with saved locations
        function updateLocationSelects() {
            const fromSelect = document.getElementById('fromLocation');
            const toSelect = document.getElementById('toLocation');
            
            // Clear existing options except the first one
            while (fromSelect.options.length > 1) {
                fromSelect.remove(1);
            }
            
            while (toSelect.options.length > 1) {
                toSelect.remove(1);
            }
            
            // Add location options
            savedLocations.forEach((location, index) => {
                const fromOption = new Option(location.name, index);
                const toOption = new Option(location.name, index);
                
                fromSelect.add(fromOption);
                toSelect.add(toOption);
            });
        }

        // Add a new location
        function addLocation() {
            const nameInput = document.getElementById('locationName');
            const addressInput = document.getElementById('locationAddress');
            
            const name = nameInput.value.trim();
            const address = addressInput.value.trim();
            
            if (!name || !address) {
                alert('Please enter both a name and address for the location');
                return;
            }
            
            savedLocations.push({ name, address });
            filteredLocations = [...savedLocations]; // Reset filter
            
            // Clear search if any
            const searchInput = document.getElementById('locationSearch');
            searchInput.value = '';
            
            saveLocations();
            renderSavedLocations();
            
            // Clear inputs
            nameInput.value = '';
            addressInput.value = '';
        }

        // Delete a location
        function deleteLocation(index) {
            savedLocations.splice(index, 1);
            
            // Update the filtered locations
            const searchInput = document.getElementById('locationSearch');
            filterLocations(searchInput.value);
            
            saveLocations();
            renderSavedLocations();
        }

        // Clear all locations
        function clearLocations() {
            if (confirm('Are you sure you want to delete all saved locations?')) {
                savedLocations = [];
                filteredLocations = [];
                
                // Clear search if any
                const searchInput = document.getElementById('locationSearch');
                searchInput.value = '';
                
                saveLocations();
                renderSavedLocations();
            }
        }

        // Convert address to coordinates (geocoding)
        function geocodeAddress(address) {
            // For demo purposes, we'll return dummy coordinates
            // In a real application, you would use a service like Google Maps Geocoding API
            
            // Generate semi-random coordinates based on the address string
            let hash = 0;
            for (let i = 0; i < address.length; i++) {
                hash = ((hash << 5) - hash) + address.charCodeAt(i);
                hash |= 0; // Convert to 32bit integer
            }
            
            // Base coordinates (somewhere in the middle of the US)
            const baseLat = 39.8283;
            const baseLng = -98.5795;
            
            // Add some variation based on the hash
            const lat = baseLat + (hash % 10) / 100;
            const lng = baseLng + (hash % 10) / 100;
            
            return { lat, lng };
        }

        // Launch a ride app with deep linking
        function launchRideApp(appName) {
            const fromIndex = document.getElementById('fromLocation').value;
            const toIndex = document.getElementById('toLocation').value;
            
            if (!fromIndex || !toIndex) {
                alert('Please select both starting point and destination');
                return;
            }
            
            if (fromIndex === toIndex) {
                alert('Starting point and destination cannot be the same');
                return;
            }
            
            const fromLocation = savedLocations[fromIndex];
            const toLocation = savedLocations[toIndex];
            
            // Convert addresses to coordinates
            const fromCoords = geocodeAddress(fromLocation.address);
            const toCoords = geocodeAddress(toLocation.address);
            
            // Prepare deep link URL based on the app
            let deepLink = '';
            
            switch(appName) {
                case 'uber':
                    deepLink = `uber://?action=setPickup&pickup[latitude]=${fromCoords.lat}&pickup[longitude]=${fromCoords.lng}&pickup[nickname]=${encodeURIComponent(fromLocation.name)}&dropoff[latitude]=${toCoords.lat}&dropoff[longitude]=${toCoords.lng}&dropoff[nickname]=${encodeURIComponent(toLocation.name)}`;
                    break;
                case 'ola':
                    deepLink = `olacabs://?pickup_lat=${fromCoords.lat}&pickup_lng=${fromCoords.lng}&pickup_title=${encodeURIComponent(fromLocation.name)}&drop_lat=${toCoords.lat}&drop_lng=${toCoords.lng}&drop_title=${encodeURIComponent(toLocation.name)}`;
                    break;
                case 'rapido':
                    deepLink = `rapido://book?src_lat=${fromCoords.lat}&src_lng=${fromCoords.lng}&src_name=${encodeURIComponent(fromLocation.name)}&dest_lat=${toCoords.lat}&dest_lng=${toCoords.lng}&dest_name=${encodeURIComponent(toLocation.name)}`;
                    break;
                default:
                    alert('Unknown ride app');
                    return;
            }
            
            // Open the deep link
            window.location.href = deepLink;
            
            // Fallback for when the app is not installed
            setTimeout(() => {
                // If we're still here after 500ms, the app probably isn't installed
                // Redirect to respective app store or web app
                
                let webFallback = '';
                
                switch(appName) {
                    case 'uber':
                        webFallback = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${fromCoords.lat}&pickup[longitude]=${fromCoords.lng}&pickup[nickname]=${encodeURIComponent(fromLocation.name)}&dropoff[latitude]=${toCoords.lat}&dropoff[longitude]=${toCoords.lng}&dropoff[nickname]=${encodeURIComponent(toLocation.name)}`;
                        break;
                    case 'ola':
                        webFallback = 'https://book.olacabs.com';
                        break;
                    case 'rapido':
                        webFallback = 'https://onlineapp.rapido.bike';
                        break;
                }
                
                window.location.href = webFallback;
            }, 500);
        }

        // Set up event listeners
        function setupEventListeners() {
            // Add location button
            document.getElementById('addLocationBtn').addEventListener('click', addLocation);
            
            // Clear locations button
            document.getElementById('clearLocationsBtn').addEventListener('click', clearLocations);
            
            // Ride app buttons
            document.getElementById('uberBtn').addEventListener('click', () => launchRideApp('uber'));
            document.getElementById('olaBtn').addEventListener('click', () => launchRideApp('ola'));
            document.getElementById('rapidoBtn').addEventListener('click', () => launchRideApp('rapido'));
            
            // Search functionality
            const searchInput = document.getElementById('locationSearch');
            searchInput.addEventListener('input', function() {
                filterLocations(this.value);
            });
        }
