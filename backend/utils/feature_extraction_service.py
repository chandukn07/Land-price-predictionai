"""
Feature extraction service for automatically fetching real estate features
from location data using Google Maps API and OpenStreetMap
"""

import googlemaps
import requests
from typing import Dict, Tuple, Optional
from config import Config
import logging
import math
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class FeatureExtractionService:
    """Service for extracting real estate features from location data"""
    
    def __init__(self, api_key: str = None):
        """Initialize Google Maps client"""
        self.api_key = api_key or Config.GOOGLE_MAPS_API_KEY
        self.client = googlemaps.Client(key=self.api_key)
        self.cache = {}  # Simple in-memory cache
        self.cache_duration = timedelta(seconds=Config.FEATURE_CACHE_DURATION)
    
    def extract_all_features(self, latitude: float, longitude: float, 
                            city_name: str = None) -> Dict:
        """
        Extract all 15 features for a given location
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            city_name: Optional city name for city center calculation
            
        Returns:
            Dict with all 15 features
        """
        try:
            location = (latitude, longitude)
            
            # Check cache
            cache_key = f"{latitude:.4f}_{longitude:.4f}"
            if cache_key in self.cache:
                cached_data, timestamp = self.cache[cache_key]
                if datetime.now() - timestamp < self.cache_duration:
                    logger.info(f"Using cached features for {cache_key}")
                    return cached_data
            
            features = {}
            
            # Extract all features
            features['building_density'] = self._get_building_density(location)
            features['population_density'] = self._get_population_density(location)
            features['avg_building_height'] = self._get_avg_building_height(location)
            features['commercial_ratio'] = self._get_commercial_ratio(location)
            features['residential_ratio'] = self._get_residential_ratio(location)
            features['distance_to_station'] = self._get_distance_to_station(location)
            features['distance_to_highway'] = self._get_distance_to_highway(location)
            features['distance_to_city_center'] = self._get_distance_to_city_center(location, city_name)
            features['school_count'] = self._get_school_count(location)
            features['hospital_count'] = self._get_hospital_count(location)
            features['park_area'] = self._get_park_area(location)
            features['road_density'] = self._get_road_density(location)
            features['public_transport_access'] = self._get_public_transport_access(location)
            features['crime_rate'] = self._get_crime_rate(location)
            features['employment_rate'] = self._get_employment_rate(location)
            
            # Cache the results
            self.cache[cache_key] = (features, datetime.now())
            
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction error: {str(e)}")
            return self._get_default_features()
    
    def _get_building_density(self, location: Tuple[float, float]) -> float:
        """Calculate building density using nearby places"""
        try:
            # Use Google Places to count buildings in area
            radius = 500  # 500m radius
            places = self.client.places_nearby(
                location=location,
                radius=radius,
                type='establishment'
            )
            
            # Estimate density (buildings per square km)
            area_km2 = (math.pi * (radius / 1000) ** 2)
            building_count = len(places.get('results', []))
            density = building_count / area_km2 if area_km2 > 0 else 0
            
            # Normalize to 0-1 scale (assuming max 1000 buildings/km2)
            return min(density / 1000, 1.0)
            
        except Exception as e:
            logger.warning(f"Building density calculation failed: {str(e)}")
            return 0.5  # Default medium density
    
    def _get_population_density(self, location: Tuple[float, float]) -> float:
        """Estimate population density from area characteristics"""
        try:
            # Use residential places as proxy for population
            radius = 1000
            places = self.client.places_nearby(
                location=location,
                radius=radius,
                type='lodging'
            )
            
            residential_count = len(places.get('results', []))
            # Normalize to 0-1 scale
            return min(residential_count / 50, 1.0)
            
        except Exception as e:
            logger.warning(f"Population density calculation failed: {str(e)}")
            return 0.5
    
    def _get_avg_building_height(self, location: Tuple[float, float]) -> float:
        """Estimate average building height from area type"""
        try:
            # Check for high-rise indicators
            places = self.client.places_nearby(
                location=location,
                radius=500,
                keyword='apartment building mall office'
            )
            
            results = places.get('results', [])
            # More commercial/apartment buildings = higher average height
            # Normalize to 0-1 scale (0 = low-rise, 1 = high-rise)
            return min(len(results) / 20, 1.0)
            
        except Exception as e:
            logger.warning(f"Building height calculation failed: {str(e)}")
            return 0.5
    
    def _get_commercial_ratio(self, location: Tuple[float, float]) -> float:
        """Calculate ratio of commercial to total establishments"""
        try:
            radius = 500
            # Get commercial places
            commercial = self.client.places_nearby(
                location=location,
                radius=radius,
                type='store'
            )
            
            # Get all places
            all_places = self.client.places_nearby(
                location=location,
                radius=radius,
                type='establishment'
            )
            
            commercial_count = len(commercial.get('results', []))
            total_count = len(all_places.get('results', []))
            
            return commercial_count / total_count if total_count > 0 else 0.3
            
        except Exception as e:
            logger.warning(f"Commercial ratio calculation failed: {str(e)}")
            return 0.3
    
    def _get_residential_ratio(self, location: Tuple[float, float]) -> float:
        """Calculate ratio of residential to total establishments"""
        try:
            # Residential is typically inverse of commercial
            commercial_ratio = self._get_commercial_ratio(location)
            return max(0, 1.0 - commercial_ratio)
            
        except Exception as e:
            logger.warning(f"Residential ratio calculation failed: {str(e)}")
            return 0.7
    
    def _get_distance_to_station(self, location: Tuple[float, float]) -> float:
        """Calculate distance to nearest train/metro station"""
        try:
            # Search for nearest station
            places = self.client.places_nearby(
                location=location,
                radius=5000,
                keyword='metro station railway station train station'
            )
            
            results = places.get('results', [])
            if not results:
                return 5.0  # Default 5km if no station found
            
            # Get closest station
            nearest = results[0]
            station_loc = nearest['geometry']['location']
            
            # Calculate distance
            distance = self._haversine_distance(
                location[0], location[1],
                station_loc['lat'], station_loc['lng']
            )
            
            return min(distance, 10.0)  # Cap at 10km
            
        except Exception as e:
            logger.warning(f"Station distance calculation failed: {str(e)}")
            return 2.5
    
    def _get_distance_to_highway(self, location: Tuple[float, float]) -> float:
        """Calculate distance to nearest highway/expressway"""
        try:
            # Search for highways
            places = self.client.places_nearby(
                location=location,
                radius=10000,
                keyword='highway expressway'
            )
            
            results = places.get('results', [])
            if not results:
                return 5.0
            
            nearest = results[0]
            highway_loc = nearest['geometry']['location']
            
            distance = self._haversine_distance(
                location[0], location[1],
                highway_loc['lat'], highway_loc['lng']
            )
            
            return min(distance, 15.0)
            
        except Exception as e:
            logger.warning(f"Highway distance calculation failed: {str(e)}")
            return 3.0
    
    def _get_distance_to_city_center(self, location: Tuple[float, float], 
                                     city_name: str = None) -> float:
        """Calculate distance to city center"""
        try:
            if not city_name:
                # Try to detect city from reverse geocode
                reverse = self.client.reverse_geocode(location)
                if reverse:
                    for component in reverse[0].get('address_components', []):
                        if 'locality' in component['types']:
                            city_name = component['long_name']
                            break
            
            if not city_name:
                return 5.0  # Default
            
            # Geocode city center
            city_center = self.client.geocode(f"{city_name} city center")
            if not city_center:
                return 5.0
            
            center_loc = city_center[0]['geometry']['location']
            
            distance = self._haversine_distance(
                location[0], location[1],
                center_loc['lat'], center_loc['lng']
            )
            
            return min(distance, 30.0)
            
        except Exception as e:
            logger.warning(f"City center distance calculation failed: {str(e)}")
            return 5.0
    
    def _get_school_count(self, location: Tuple[float, float]) -> int:
        """Count schools within 2km radius"""
        try:
            places = self.client.places_nearby(
                location=location,
                radius=2000,
                type='school'
            )
            
            return len(places.get('results', []))
            
        except Exception as e:
            logger.warning(f"School count calculation failed: {str(e)}")
            return 5
    
    def _get_hospital_count(self, location: Tuple[float, float]) -> int:
        """Count hospitals within 2km radius"""
        try:
            places = self.client.places_nearby(
                location=location,
                radius=2000,
                type='hospital'
            )
            
            return len(places.get('results', []))
            
        except Exception as e:
            logger.warning(f"Hospital count calculation failed: {str(e)}")
            return 3
    
    def _get_park_area(self, location: Tuple[float, float]) -> float:
        """Calculate total park area within 1km radius"""
        try:
            places = self.client.places_nearby(
                location=location,
                radius=1000,
                type='park'
            )
            
            park_count = len(places.get('results', []))
            # Estimate area (normalized 0-1)
            return min(park_count / 10, 1.0)
            
        except Exception as e:
            logger.warning(f"Park area calculation failed: {str(e)}")
            return 0.3
    
    def _get_road_density(self, location: Tuple[float, float]) -> float:
        """Estimate road density from nearby roads"""
        try:
            # Use nearby roads as proxy
            places = self.client.places_nearby(
                location=location,
                radius=500,
                keyword='road street'
            )
            
            road_count = len(places.get('results', []))
            return min(road_count / 30, 1.0)
            
        except Exception as e:
            logger.warning(f"Road density calculation failed: {str(e)}")
            return 0.5
    
    def _get_public_transport_access(self, location: Tuple[float, float]) -> float:
        """Calculate public transport accessibility score"""
        try:
            # Count transit stations and bus stops
            places = self.client.places_nearby(
                location=location,
                radius=1000,
                keyword='bus stop metro station transit'
            )
            
            transit_count = len(places.get('results', []))
            # Normalize to 0-1 scale
            return min(transit_count / 20, 1.0)
            
        except Exception as e:
            logger.warning(f"Public transport access calculation failed: {str(e)}")
            return 0.5
    
    def _get_crime_rate(self, location: Tuple[float, float]) -> float:
        """
        Estimate crime rate (inverse of safety)
        Note: This is a simplified estimation. For production, use official crime data APIs
        """
        try:
            # Use police stations as inverse indicator (more police = safer)
            places = self.client.places_nearby(
                location=location,
                radius=2000,
                type='police'
            )
            
            police_count = len(places.get('results', []))
            # More police stations = lower crime (inverse relationship)
            crime_score = max(0, 1.0 - (police_count / 10))
            
            return min(crime_score, 1.0)
            
        except Exception as e:
            logger.warning(f"Crime rate calculation failed: {str(e)}")
            return 0.3  # Default low crime
    
    def _get_employment_rate(self, location: Tuple[float, float]) -> float:
        """
        Estimate employment rate from business density
        Note: For production, use official employment statistics
        """
        try:
            # Count businesses and offices
            places = self.client.places_nearby(
                location=location,
                radius=2000,
                keyword='office business company'
            )
            
            business_count = len(places.get('results', []))
            # Normalize to 0-1 scale (more businesses = higher employment)
            return min(business_count / 30, 1.0)
            
        except Exception as e:
            logger.warning(f"Employment rate calculation failed: {str(e)}")
            return 0.7  # Default medium-high employment
    
    def _haversine_distance(self, lat1: float, lon1: float, 
                           lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)
        
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _get_default_features(self) -> Dict:
        """Return default feature values when extraction fails"""
        return {
            'building_density': 0.5,
            'population_density': 0.5,
            'avg_building_height': 0.5,
            'commercial_ratio': 0.3,
            'residential_ratio': 0.7,
            'distance_to_station': 2.5,
            'distance_to_highway': 3.0,
            'distance_to_city_center': 5.0,
            'school_count': 5,
            'hospital_count': 3,
            'park_area': 0.3,
            'road_density': 0.5,
            'public_transport_access': 0.5,
            'crime_rate': 0.3,
            'employment_rate': 0.7
        }
