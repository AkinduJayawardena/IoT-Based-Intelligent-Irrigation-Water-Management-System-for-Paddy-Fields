import math
import requests
from datetime import datetime, date

def get_kc(day):
    if day <= 15:
        return 0.5
    elif day <= 30:
        return 0.8
    elif day <= 45:
        return 1.2
    elif day <= 75:
        return 1.3
    elif day <= 90:
        return 1.2
    elif day <= 105:
        return 1.1
    else:
        return 0.7

def calculate_net_radiation(Tmin, Tmax, ea, lat_deg, date_str, elevation_m):
    """
    Calculates Net Radiation (Rn) based on FAO-56 Penman-Monteith equations.
    """
    # 1. Calculate Day of the Year (J)
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    J = date_obj.timetuple().tm_yday

    # 2. Convert Latitude to Radians
    phi = (math.pi / 180) * lat_deg

    # 3. Calculate Inverse Relative Distance Earth-Sun (d_r)
    d_r = 1 + 0.033 * math.cos((2 * math.pi / 365) * J)

    # 4. Calculate Solar Declination (delta)
    delta = 0.409 * math.sin((2 * math.pi / 365) * J - 1.39)

    # 5. Calculate Sunset Hour Angle (omega_s)
    arg_acos = -math.tan(phi) * math.tan(delta)
    if arg_acos > 1:
        arg_acos = 1
    elif arg_acos < -1:
        arg_acos = -1
    omega_s = math.acos(arg_acos)

    # 6. Calculate Extraterrestrial Radiation (R_a)
    G_sc = 0.0820
    R_a = (24 * 60 / math.pi) * G_sc * d_r * (
        omega_s * math.sin(phi) * math.sin(delta) +
        math.cos(phi) * math.cos(delta) * math.sin(omega_s)
    )

    # 7. Calculate Solar Radiation (R_s) using Hargreaves formula
    temp_diff = Tmax - Tmin
    k_Rs = 0.16  # interior region in Sri Lanka
    R_s = k_Rs * R_a * math.sqrt(temp_diff)

    # 8. Calculate Clear-Sky Radiation (R_so)
    R_so = (0.75 + 2e-5 * elevation_m) * R_a

    # 9. Calculate Net Shortwave Radiation (R_ns)
    albedo = 0.23
    R_ns = (1 - albedo) * R_s

    # 10. Calculate Net Longwave Radiation (R_nl)
    sigma = 4.903e-9
    Tmax_K = Tmax + 273.16
    Tmin_K = Tmin + 273.16

    mean_temp_term = (math.pow(Tmax_K, 4) + math.pow(Tmin_K, 4)) / 2
    vapor_term = 0.34 - 0.14 * math.sqrt(ea)
    
    # Prevent divide by zero if R_so is 0
    if R_so > 0:
        cloud_term = 1.35 * (R_s / R_so) - 0.35
    else:
        cloud_term = -0.35
        
    R_nl = sigma * mean_temp_term * vapor_term * cloud_term

    # 11. Calculate final Net Radiation (R_n) in MJ/m2/day
    R_n_MJ = R_ns - R_nl

    # 12. Convert to mm/day
    latent_heat = 2.45
    R_n_mm = R_n_MJ / latent_heat

    return R_n_mm

def get_elevation(lat, lon):
    try:
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
        res = requests.get(url, timeout=5)
        return res.json()["results"][0]["elevation"]
    except Exception:
        return 500  # Fallback to elevation of Peradeniya, Sri Lanka

def calculate_5_day_demand(lat, lon, planting_date_str, area, channel_efficiency, api_key="3ed62f8faf22430f54666b224f9da42d"):
    """
    Fetches the 5-day weather forecast from OpenWeatherMap and computes demand metrics
    for 5 days starting from today/earliest forecast date.
    """
    planting_date = datetime.strptime(planting_date_str, "%Y-%m-%d")
    elevation_m = get_elevation(lat, lon)
    
    # Get weather forecast data
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    res = requests.get(url, timeout=10)
    res.raise_for_status()
    data = res.json()
    
    # Group forecast entries by date
    daily_groups = {}
    for entry in data["list"]:
        # entry["dt_txt"] is like "2026-06-17 12:00:00"
        date_str = entry["dt_txt"].split(" ")[0]
        if date_str not in daily_groups:
            daily_groups[date_str] = {
                "temp_list": [],
                "rh_list": [],
                "wind_list": [],
                "rain_list": []
            }
        
        main_data = entry["main"]
        daily_groups[date_str]["temp_list"].append(main_data["temp"])
        daily_groups[date_str]["rh_list"].append(main_data["humidity"])
        daily_groups[date_str]["wind_list"].append(entry["wind"]["speed"])
        
        # Rain is specified in mm for 3 hours
        rain_val = entry.get("rain", {}).get("3h", 0)
        daily_groups[date_str]["rain_list"].append(rain_val)
        
    results = []
    
    # Sort the dates and take the first 5 days
    sorted_dates = sorted(daily_groups.keys())
    target_dates = sorted_dates[:5]
    
    for date_str in target_dates:
        group = daily_groups[date_str]
        T_list = group["temp_list"]
        RH_list = group["rh_list"]
        wind_list = group["wind_list"]
        rain_list = group["rain_list"]
        
        if not T_list:
            continue
            
        Tmean = sum(T_list) / len(T_list)
        RHmean = sum(RH_list) / len(RH_list)
        u10 = sum(wind_list) / len(wind_list)
        rain = sum(rain_list)
        Tmax = max(T_list)
        Tmin = min(T_list)
        
        # Convert wind speed to 2m height
        u2 = u10 * 0.748
        
        # Vapor pressure equations
        es = 0.6108 * math.exp((17.27 * Tmean) / (Tmean + 237.3))
        ea = (RHmean / 100) * es
        
        # Delta slope curve
        Delta = (4098 * es) / ((Tmean + 237.3) ** 2)
        
        # Psychrometric constant (assuming sea level atmospheric pressure)
        gamma = 0.0665
        
        # Net Radiation (Rn) calculation
        Rn = calculate_net_radiation(Tmin, Tmax, ea, lat, date_str, elevation_m)
        
        # Wind function
        fu = 0.27 * (1 + u2 / 100)
        
        # Weighting factor
        W = Delta / (Delta + gamma)
        
        # ET0 (Evaporation/Evapotranspiration in mm/day)
        ET0 = (W * Rn) + ((1 - W) * fu * (es - ea))
        
        # Crop Coefficient (Kc)
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        days_after_planting = (date_obj - planting_date).days
        Kc = get_kc(days_after_planting)
        
        # Crop Water Requirement (CWR in mm/day)
        CWR = Kc * ET0
        
        # Effective rainfall (simple model: 80%)
        Reff = 0.8 * rain
        
        # Irrigation Demand in liters/day (1 mm of depth on 1 m² = 1 liter)
        demand = max(0.0, ((CWR - Reff) * area) / channel_efficiency)
        
        results.append({
            "date": date_str,
            "days_after_planting": days_after_planting,
            "kc": round(Kc, 2),
            "temp_mean": round(Tmean, 2),
            "temp_max": round(Tmax, 2),
            "temp_min": round(Tmin, 2),
            "rh_mean": round(RHmean, 2),
            "et0": round(max(0.0, ET0), 2),
            "cwr": round(max(0.0, CWR), 2),
            "rain": round(rain, 2),
            "demand": round(demand, 2),
            "elevation": round(elevation_m, 2),
            "u10": round(u10, 2)
        })
        
    return results

if __name__ == "__main__":
    # Small test run
    print("Testing demand calculations...")
    res = calculate_5_day_demand(7.2542, 80.5967, "2026-04-01", 1000, 0.7)
    for r in res:
        print(f"Date: {r['date']} | Kc: {r['kc']} | ET0: {r['et0']} mm | CWR: {r['cwr']} mm | Rain: {r['rain']} mm | Demand: {r['demand']} L")
