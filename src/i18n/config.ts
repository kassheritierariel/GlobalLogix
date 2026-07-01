import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.shipments': 'Shipments',
        'nav.tracking': 'Live Tracking',
        'nav.analytics': 'Analytics',
        'nav.customers': 'Customers',
        'nav.agencies': 'Agencies',
        'nav.settings': 'Settings',
        'nav.admin': 'Administration',
        'nav.logout': 'Sign Out',
        'nav.session': 'Session',
        
        // Header
        'header.searchPlaceholder': 'Search shipment, customer, or container...',

        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error occurred',
        'common.export': 'Export Data',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.delete': 'Delete',
        'common.permanentDelete': 'Permanent Deletion',
        'common.save': 'Save',
        'common.filters': 'Advanced Filters',
        'common.resetFilters': 'Reset Filters',
        
        // Shipments
        'shipments.title': 'Freight Manifest',
        'shipments.subtitle': 'Real-time logistics flow control and direction.',
        'shipments.new': 'New Shipment',
        'shipments.create': 'Create Shipment',
        'shipments.processing': 'Processing...',
        'shipments.deleteWarning': 'You are about to delete shipment',
        'shipments.deleteWarningP2': 'This action will permanently destroy all associated data. Do you really want to continue?',
        'shipments.destroying': 'Destroying...',
        'shipments.filterPlaceholder': 'Filter ID, Destination, Client...',
        
        // Shipment Status & Types
        'status.pending': 'Pending',
        'status.in-transit': 'In Transit',
        'status.customs': 'Customs',
        'status.delayed': 'Delayed',
        'status.delivered': 'Delivered',
        'type.air': 'Air',
        'type.sea': 'Sea',
        'type.land': 'Land',
        
        // Forms
        'form.sender': 'Sender',
        'form.receiver': 'Receiver',
        'form.origin': 'Origin',
        'form.destination': 'Destination',
        'form.type': 'Vector (Type)',
        'form.weight': 'Weight (Kg)',
        'form.status': 'Status',
        'form.dateFrom': 'From (Date)',
        'form.dateTo': 'To (Date)',
        
        // Shipment Details & Invoice
        'invoice.generate': 'Generate Invoice',
        'invoice.generating': 'Generating...',
        'invoice.sendWhatsApp': 'Send via WhatsApp',
        'invoice.title': 'Invoice',
        
        // Dashboard
        'dashboard.title': 'Command Center',
        'dashboard.subtitle': 'Operational overview and global performance metrics.',
        
        // Analytics
        'analytics.title': 'Strategic Analytics',
        'analytics.subtitle': 'Operational intelligence and logistics market forecasts.'
      }
    },
    fr: {
      translation: {
        // Navigation
        'nav.dashboard': 'Tableau de bord',
        'nav.shipments': 'Expéditions',
        'nav.tracking': 'Suivi en Direct',
        'nav.analytics': 'Analyses',
        'nav.customers': 'Clients',
        'nav.agencies': 'Agences',
        'nav.settings': 'Paramètres',
        'nav.admin': 'Administration',
        'nav.logout': 'Déconnexion',
        'nav.session': 'Session',
        
        // Header
        'header.searchPlaceholder': 'Rechercher une expédition, un client ou un conteneur...',
        
        // Common
        'common.loading': 'Chargement...',
        'common.error': 'Une erreur est survenue',
        'common.export': 'Exporter Données',
        'common.cancel': 'Annuler',
        'common.confirm': 'Confirmer',
        'common.delete': 'Supprimer',
        'common.permanentDelete': 'Suppression Définitive',
        'common.save': 'Enregistrer',
        'common.filters': 'Filtres Avancés',
        'common.resetFilters': 'Réinitialiser les filtres',
        
        // Shipments
        'shipments.title': 'Manifeste de Fret',
        'shipments.subtitle': 'Direction et contrôle des flux logistiques en temps réel.',
        'shipments.new': 'Nouvelle Expédition',
        'shipments.create': 'Créer Expédition',
        'shipments.processing': 'Traitement...',
        'shipments.deleteWarning': 'Vous êtes sur le point de supprimer l\'expédition',
        'shipments.deleteWarningP2': 'Cette action détruira de manière permanente toutes les données associées. Voulez-vous vraiment continuer ?',
        'shipments.destroying': 'Destruction...',
        'shipments.filterPlaceholder': 'Filtre ID, Destination, Client...',
        
        // Shipment Status & Types
        'status.pending': 'En attente',
        'status.in-transit': 'En transit',
        'status.customs': 'Dédouanement',
        'status.delayed': 'Retardé',
        'status.delivered': 'Livré',
        'type.air': 'Aérien',
        'type.sea': 'Maritime',
        'type.land': 'Terrestre',
        
        // Forms
        'form.sender': 'Expéditeur',
        'form.receiver': 'Destinataire',
        'form.origin': 'Origine',
        'form.destination': 'Destination',
        'form.type': 'Vecteur (Type)',
        'form.weight': 'Charge (Kg)',
        'form.status': 'Statut',
        'form.dateFrom': 'De (Date)',
        'form.dateTo': 'À (Date)',
        
        // Shipment Details & Invoice
        'invoice.generate': 'Générer Facture',
        'invoice.generating': 'Génération...',
        'invoice.sendWhatsApp': 'Envoyer via WhatsApp',
        'invoice.title': 'Facture',
        
        // Dashboard
        'dashboard.title': 'Centre de Commandement',
        'dashboard.subtitle': 'Vue d\'ensemble opérationnelle et métriques de performance globales.',
        
        // Analytics
        'analytics.title': 'Analyses Stratégiques',
        'analytics.subtitle': 'Intelligence opérationnelle et prévisions du marché logistique.'
      }
    }
  },
  lng: 'fr',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
