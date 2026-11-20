export const businessUrl = 'https://www.exploresumatraescape.com';
export const businessId = businessUrl + '/#organization';

export const siteIdentity = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TravelAgency',
      '@id': businessId,
      name: 'Explore Sumatra Escape',
      url: businessUrl,
      description: 'Guided jungle treks in Bukit Lawang and custom journeys across Sumatra.',
      logo: {
        '@type': 'ImageObject',
        url: businessUrl + '/assets/logo.png',
      },
      image: businessUrl + '/assets/photos/team-partnership.webp',
      telephone: '+34615788239',
      areaServed: [
        {'@type': 'Place', name: 'Bukit Lawang, North Sumatra, Indonesia'},
        {'@type': 'Place', name: 'Sumatra, Indonesia'},
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Booking support',
        telephone: '+34615788239',
        url: 'https://wa.me/34615788239',
        availableLanguage: ['English', 'Spanish', 'Indonesian'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': businessUrl + '/#website',
      url: businessUrl,
      name: 'Explore Sumatra Escape',
      publisher: {'@id': businessId},
      inLanguage: ['en', 'es', 'de', 'fr', 'it', 'nl', 'pt'],
    },
  ],
};
