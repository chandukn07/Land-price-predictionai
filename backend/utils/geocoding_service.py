"""
Geocoding service for converting location strings to coordinates
and extracting location-based features using Google Maps API
"""

import googlemaps
from typing import Dict, Optional, Tuple
from config import Config
import logging

logger = logging.getLogger(__name__)


class GeocodingService:
    """Service for geocoding locations and fetching place details"""
    
    def __init__(self, api_key: str = None):
        """Initialize Google Maps client"""
        self.api_key = api_key or Config.GOOGLE_MAPS_API_KEY
        self.client = googlemaps.Client(key=self.api_key)
    
    def geocode_location(self, location: str) -> Optional[Dict]:
        """
        Convert location string to geographic coordinates
        
        Args:
            location: Location string (e.g., "Bandra West, Mumbai")
            
        Returns:
            Dict with lat, lng, formatted_address, place_id
        """
        try:
            geocode_result = self.client.geocode(location)
            
            if not geocode_result:
                logger.warning(f"No geocoding results found for: {location}")
                return None
            
            result = geocode_result[0]
            geometry = result['geometry']['location']
            
            return {
                'latitude': geometry['lat'],
                'longitude': geometry['lng'],
                'formatted_address': result['formatted_address'],
                'place_id': result['place_id'],
                'location_type': result['geometry']['location_type'],
                'address_components': result.get('address_components', [])
            }
            
        except Exception as e:
            logger.error(f"Geocoding error for '{location}': {str(e)}")
            return None
    
    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict]:
        """
        Convert coordinates to address
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Dict with address information
        """
        try:
            reverse_result = self.client.reverse_geocode((latitude, longitude))
            
            if not reverse_result:
                return None
            
            result = reverse_result[0]
            
            return {
                'formatted_address': result['formatted_address'],
                'place_id': result['place_id'],
                'address_components': result.get('address_components', [])
            }
            
        except Exception as e:
            logger.error(f"Reverse geocoding error: {str(e)}")
            return None
    
    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """
        Get detailed information about a place
        
        Args:
            place_id: Google Place ID
            
        Returns:
            Dict with place details
        """
        try:
            place_result = self.client.place(place_id)
            
            if place_result['status'] != 'OK':
                return None
            
            return place_result['result']
            
        except Exception as e:
            logger.error(f"Place details error: {str(e)}")
            return None
    
    def autocomplete(self, input_text: str, location: Tuple[float, float] = None, 
                     radius: int = 50000) -> list:
        """
        Get place autocomplete suggestions
        
        Args:
            input_text: User input text
            location: Optional (lat, lng) tuple to bias results
            radius: Search radius in meters
            
        Returns:
            List of autocomplete predictions
        """
        try:
            predictions = self.client.places_autocomplete(
                input_text=input_text,
                location=location,
                radius=radius,
                types=['geocode']
            )
            
            return [
                {
                    'description': pred['description'],
                    'place_id': pred['place_id'],
                    'main_text': pred['structured_formatting']['main_text'],
                    'secondary_text': pred['structured_formatting'].get('secondary_text', '')
                }
                for pred in predictions
            ]
            
        except Exception as e:
            logger.error(f"Autocomplete error: {str(e)}")
            return []
    
    def get_city_center(self, city_name: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates of city center
        
        Args:
            city_name: Name of the city
            
        Returns:
            Tuple of (latitude, longitude) or None
        """
        result = self.geocode_location(city_name)
        if result:
            return (result['latitude'], result['longitude'])
        return None
    
    def calculate_distance(self, origin: Tuple[float, float], 
                          destination: Tuple[float, float]) -> Optional[float]:
        """
        Calculate distance between two points using Distance Matrix API
        
        Args:
            origin: (lat, lng) tuple for origin
            destination: (lat, lng) tuple for destination
            
        Returns:
            Distance in kilometers
        """
        try:
            result = self.client.distance_matrix(
                origins=[origin],
                destinations=[destination],
                mode='driving'
            )
            
            if result['status'] != 'OK':
                return None
            
            element = result['rows'][0]['elements'][0]
            
            if element['status'] != 'OK':
                return None
            
            # Convert meters to kilometers
            distance_km = element['distance']['value'] / 1000.0
            return distance_km
            
        except Exception as e:
            logger.error(f"Distance calculation error: {str(e)}")
            return None
