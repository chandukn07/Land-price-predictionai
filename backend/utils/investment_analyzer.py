"""
Investment Score & ROI Calculator
Analyzes location features to calculate investment potential and ROI projections
"""

from typing import Dict, Tuple
import math


class InvestmentAnalyzer:
    """Calculate investment scores and ROI projections based on location features"""
    
    # Weight factors for different aspects
    WEIGHTS = {
        'connectivity': 0.25,
        'amenities': 0.20,
        'infrastructure': 0.20,
        'livability': 0.15,
        'growth_potential': 0.20
    }
    
    def calculate_investment_score(self, features: Dict[str, float], 
                                   predicted_price: float) -> Dict:
        """
        Calculate comprehensive investment score
        
        Args:
            features: Dict of 15 location features
            predicted_price: ML predicted land price
            
        Returns:
            Dict with investment score, breakdown, and insights
        """
        # Calculate sub-scores
        connectivity_score = self._calculate_connectivity_score(features)
        amenities_score = self._calculate_amenities_score(features)
        infrastructure_score = self._calculate_infrastructure_score(features)
        livability_score = self._calculate_livability_score(features)
        growth_score = self._calculate_growth_potential(features)
        
        # Weighted overall score
        overall_score = (
            connectivity_score * self.WEIGHTS['connectivity'] +
            amenities_score * self.WEIGHTS['amenities'] +
            infrastructure_score * self.WEIGHTS['infrastructure'] +
            livability_score * self.WEIGHTS['livability'] +
            growth_score * self.WEIGHTS['growth_potential']
        )
        
        # ROI Projections
        roi_1yr, roi_3yr, roi_5yr = self._calculate_roi_projections(
            features, overall_score
        )
        
        # Rental Yield
        rental_yield = self._estimate_rental_yield(features, predicted_price)
        
        # Investment Grade
        grade = self._get_investment_grade(overall_score)
        
        # Risk Level
        risk = self._assess_risk_level(features, overall_score)
        
        # Key insights
        insights = self._generate_insights(features, overall_score)
        
        return {
            'overall_score': round(overall_score, 1),
            'grade': grade,
            'breakdown': {
                'connectivity': round(connectivity_score, 1),
                'amenities': round(amenities_score, 1),
                'infrastructure': round(infrastructure_score, 1),
                'livability': round(livability_score, 1),
                'growth_potential': round(growth_score, 1)
            },
            'roi_projections': {
                '1_year': round(roi_1yr, 1),
                '3_years': round(roi_3yr, 1),
                '5_years': round(roi_5yr, 1)
            },
            'rental_yield': round(rental_yield, 2),
            'risk_level': risk,
            'insights': insights
        }
    
    def _calculate_connectivity_score(self, features: Dict) -> float:
        """Score based on transport connectivity"""
        score = 0.0
        
        # Distance to station (closer is better, max score at 0.5km)
        station_dist = features.get('distance_to_station', 5.0)
        station_score = max(0, 100 - (station_dist / 5.0 * 50))  # 0-50 points
        
        # Distance to highway (sweet spot at 2-3km)
        highway_dist = features.get('distance_to_highway', 10.0)
        if 2.0 <= highway_dist <= 4.0:
            highway_score = 30
        elif highway_dist < 2.0:
            highway_score = 20  # Too close might be noisy
        else:
            highway_score = max(0, 30 - (highway_dist - 4.0) * 5)
        
        # Public transport access
        transport_access = features.get('public_transport_access', 0.5)
        transport_score = transport_access * 20  # 0-20 points
        
        score = station_score + highway_score + transport_score
        return min(100, score)
    
    def _calculate_amenities_score(self, features: Dict) -> float:
        """Score based on nearby amenities"""
        score = 0.0
        
        # Schools (more is better, up to 20)
        school_count = features.get('school_count', 0)
        school_score = min(40, school_count * 2)
        
        # Hospitals (more is better, up to 10)
        hospital_count = features.get('hospital_count', 0)
        hospital_score = min(30, hospital_count * 3)
        
        # Parks and green spaces
        park_area = features.get('park_area', 0.0)
        park_score = park_area * 30
        
        score = school_score + hospital_score + park_score
        return min(100, score)
    
    def _calculate_infrastructure_score(self, features: Dict) -> float:
        """Score based on infrastructure quality"""
        score = 0.0
        
        # Road density (moderate is good)
        road_density = features.get('road_density', 0.5)
        if 0.4 <= road_density <= 0.7:
            road_score = 35
        else:
            road_score = max(0, 35 - abs(road_density - 0.55) * 50)
        
        # Building density (indicator of development)
        building_density = features.get('building_density', 0.5)
        building_score = min(35, building_density * 50)
        
        # Employment rate (economic activity)
        employment = features.get('employment_rate', 0.5)
        employment_score = employment * 30
        
        score = road_score + building_score + employment_score
        return min(100, score)
    
    def _calculate_livability_score(self, features: Dict) -> float:
        """Score based on quality of life factors"""
        score = 0.0
        
        # Crime rate (lower is better)
        crime_rate = features.get('crime_rate', 0.5)
        safety_score = (1 - crime_rate) * 40
        
        # Residential ratio (family-friendly areas)
        residential_ratio = features.get('residential_ratio', 0.5)
        residential_score = residential_ratio * 30
        
        # Average building height (indicator of area type)
        building_height = features.get('avg_building_height', 0.5)
        # Mid-rise areas often most livable
        if 0.3 <= building_height <= 0.6:
            height_score = 30
        else:
            height_score = max(0, 30 - abs(building_height - 0.45) * 60)
        
        score = safety_score + residential_score + height_score
        return min(100, score)
    
    def _calculate_growth_potential(self, features: Dict) -> float:
        """Score based on future growth indicators"""
        score = 0.0
        
        # Distance to city center (closer generally appreciates more)
        city_dist = features.get('distance_to_city_center', 10.0)
        if city_dist < 5.0:
            center_score = 40
        elif city_dist < 10.0:
            center_score = 30
        elif city_dist < 20.0:
            center_score = 20
        else:
            center_score = 10
        
        # Commercial ratio (economic activity indicator)
        commercial_ratio = features.get('commercial_ratio', 0.3)
        # Sweet spot around 30-50% commercial
        if 0.25 <= commercial_ratio <= 0.50:
            commercial_score = 35
        else:
            commercial_score = max(0, 35 - abs(commercial_ratio - 0.375) * 50)
        
        # Population density (growth indicator)
        pop_density = features.get('population_density', 0.5)
        if 0.4 <= pop_density <= 0.7:
            pop_score = 25
        else:
            pop_score = max(0, 25 - abs(pop_density - 0.55) * 40)
        
        score = center_score + commercial_score + pop_score
        return min(100, score)
    
    def _calculate_roi_projections(self, features: Dict, 
                                   overall_score: float) -> Tuple[float, float, float]:
        """
        Project ROI for 1, 3, and 5 years
        Based on location score and features
        """
        # Base appreciation rate (3-15% per year based on score)
        base_rate = 3.0 + (overall_score / 100) * 12.0
        
        # Adjust for specific factors
        
        # Connectivity bonus
        station_dist = features.get('distance_to_station', 5.0)
        if station_dist < 1.0:
            base_rate += 2.0  # Metro nearby = +2%
        
        # City center proximity bonus
        city_dist = features.get('distance_to_city_center', 10.0)
        if city_dist < 5.0:
            base_rate += 1.5
        
        # Schools bonus (family areas appreciate well)
        school_count = features.get('school_count', 0)
        if school_count > 10:
            base_rate += 1.0
        
        # Commercial area bonus
        commercial_ratio = features.get('commercial_ratio', 0.3)
        if commercial_ratio > 0.4:
            base_rate += 0.5
        
        # Cap the rate
        annual_rate = min(base_rate, 18.0)
        
        # Calculate compound returns
        roi_1yr = annual_rate
        roi_3yr = ((1 + annual_rate/100) ** 3 - 1) * 100
        roi_5yr = ((1 + annual_rate/100) ** 5 - 1) * 100
        
        return roi_1yr, roi_3yr, roi_5yr
    
    def _estimate_rental_yield(self, features: Dict, price: float) -> float:
        """
        Estimate annual rental yield (%)
        Based on location characteristics
        """
        # Base yield 2-4% depending on area type
        base_yield = 2.5
        
        # Higher yield in commercial areas
        commercial_ratio = features.get('commercial_ratio', 0.3)
        base_yield += commercial_ratio * 1.5
        
        # Higher yield near transport
        transport_access = features.get('public_transport_access', 0.5)
        base_yield += transport_access * 0.5
        
        # Higher yield with more employment
        employment = features.get('employment_rate', 0.5)
        base_yield += employment * 0.5
        
        return min(base_yield, 5.0)  # Cap at 5%
    
    def _get_investment_grade(self, score: float) -> str:
        """Convert score to letter grade"""
        if score >= 85:
            return 'A+'
        elif score >= 75:
            return 'A'
        elif score >= 65:
            return 'B+'
        elif score >= 55:
            return 'B'
        elif score >= 45:
            return 'C+'
        elif score >= 35:
            return 'C'
        else:
            return 'D'
    
    def _assess_risk_level(self, features: Dict, score: float) -> str:
        """Assess investment risk level"""
        risk_factors = 0
        
        # Check various risk indicators
        if features.get('crime_rate', 0.5) > 0.6:
            risk_factors += 1
        
        if features.get('distance_to_station', 5.0) > 5.0:
            risk_factors += 1
        
        if features.get('distance_to_city_center', 10.0) > 20.0:
            risk_factors += 1
        
        if score < 50:
            risk_factors += 1
        
        if risk_factors == 0:
            return 'Low'
        elif risk_factors <= 2:
            return 'Moderate'
        else:
            return 'High'
    
    def _generate_insights(self, features: Dict, score: float) -> list:
        """Generate key insights about the investment"""
        insights = []
        
        # Connectivity insights
        station_dist = features.get('distance_to_station', 5.0)
        if station_dist < 1.0:
            insights.append('Excellent metro connectivity - major growth driver')
        elif station_dist > 5.0:
            insights.append('Limited public transport - may affect appreciation')
        
        # Amenities insights
        school_count = features.get('school_count', 0)
        if school_count > 15:
            insights.append('Premium education hub - attracts families')
        
        # Location insights
        city_dist = features.get('distance_to_city_center', 10.0)
        if city_dist < 5.0:
            insights.append('Prime central location - high demand area')
        elif city_dist > 15.0:
            insights.append('Suburban location - slower appreciation expected')
        
        # Safety insights
        crime_rate = features.get('crime_rate', 0.5)
        if crime_rate < 0.3:
            insights.append('Very safe neighborhood - premium for families')
        
        # Commercial insights
        commercial_ratio = features.get('commercial_ratio', 0.3)
        if commercial_ratio > 0.5:
            insights.append('Commercial zone - good rental potential')
        
        # Overall recommendation
        if score >= 75:
            insights.append('Strong buy recommendation - excellent investment')
        elif score >= 60:
            insights.append('Good investment opportunity - steady returns')
        elif score >= 45:
            insights.append('Moderate investment - carefully evaluate goals')
        else:
            insights.append('High risk area - consider alternatives')
        
        return insights[:5]  # Return top 5 insights
