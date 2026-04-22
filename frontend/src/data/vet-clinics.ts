export type VetClinic = {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  rating: number;
  lat: number;
  lng: number;
  openNow: boolean;
};

export const vetClinics: VetClinic[] = [
  {
    id: "emerald-city-animal-hospital",
    name: "Emerald City Animal Hospital",
    address: "456 Broadway E",
    city: "Seattle, WA",
    zipCode: "98102",
    phone: "+12065550101",
    rating: 4.5,
    lat: 47.6221,
    lng: -122.3212,
    openNow: true,
  },
  {
    id: "compassion-pet-care",
    name: "Compassion Pet Care",
    address: "789 Queen Anne Ave N",
    city: "Seattle, WA",
    zipCode: "98109",
    phone: "+12065550102",
    rating: 4.9,
    lat: 47.6372,
    lng: -122.3574,
    openNow: false,
  },
  {
    id: "urban-vet-specialists",
    name: "Urban Vet Specialists",
    address: "321 Westlake Ave N",
    city: "Seattle, WA",
    zipCode: "98109",
    phone: "+12065550103",
    rating: 4.7,
    lat: 47.6213,
    lng: -122.3382,
    openNow: true,
  },
  {
    id: "puget-sound-veterinary-center",
    name: "Puget Sound Veterinary Center",
    address: "1400 1st Ave",
    city: "Seattle, WA",
    zipCode: "98101",
    phone: "+12065550104",
    rating: 4.6,
    lat: 47.6088,
    lng: -122.3395,
    openNow: true,
  },
  {
    id: "lakeview-animal-clinic",
    name: "Lakeview Animal Clinic",
    address: "2400 Eastlake Ave E",
    city: "Seattle, WA",
    zipCode: "98102",
    phone: "+12065550105",
    rating: 4.8,
    lat: 47.6426,
    lng: -122.3251,
    openNow: false,
  },
  {
    id: "rainier-pet-emergency",
    name: "Rainier Pet Emergency",
    address: "3800 Rainier Ave S",
    city: "Seattle, WA",
    zipCode: "98118",
    phone: "+12065550106",
    rating: 4.4,
    lat: 47.5719,
    lng: -122.2863,
    openNow: true,
  },
];
