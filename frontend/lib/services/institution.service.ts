/**
 * Academic Institution Service
 * Phase 9 Day 25.2: Production-grade institutional authentication
 *
 * This service demonstrates how to properly integrate with established
 * institutional authentication systems using external APIs and services.
 *
 * ============================================================================
 * PRODUCTION APPROACHES FOR INSTITUTIONAL AUTHENTICATION:
 * ============================================================================
 *
 * 1. ROR API (Research Organization Registry) - FREE & OPEN
 *    - 100,000+ research organizations worldwide
 *    - REST API for searching institutions
 *    - https://ror.org/
 *    - Use for: Institution lookup and metadata
 *
 * 2. Shibboleth WAYF (Where Are You From) Service - STANDARD
 *    - InCommon (US): https://incommon.org/
 *    - UKAMF (UK): https://www.ukfederation.org.uk/
 *    - eduGAIN (Global): https://edugain.org/
 *    - Use for: Federated identity management
 *
 * 3. OpenAthens - COMMERCIAL
 *    - https://www.openathens.net/
 *    - 10,000+ institutions pre-configured
 *    - Use for: Turnkey institutional access
 *
 * 4. ORCID Institutional Integration - ACADEMIC
 *    - https://orcid.org/
 *    - Use for: Researcher identity verification
 *
 * ============================================================================
 * CURRENT IMPLEMENTATION:
 * ============================================================================
 * Uses ROR API for dynamic institution search (real API calls)
 * Simulates SSO redirect flow (would be real in production)
 */

import { toast } from 'sonner';

export interface Institution {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city?: string | undefined;
  type: string[]; // e.g., ['Education', 'Healthcare', 'Government']
  rorId: string; // Research Organization Registry ID
  homepage?: string | undefined;
  shibbolethEntityId?: string | undefined;
  authMethod: 'shibboleth' | 'openathens' | 'orcid';
  aliases?: string[] | undefined; // Alternative names
}

export interface RORSearchResult {
  id: string;
  name: string;
  types: string[];
  country: {
    country_name: string;
    country_code: string;
  };
  addresses: Array<{
    city: string;
  }>;
  links: string[];
  aliases: string[];
  acronyms: string[];
}

export interface InstitutionSearchParams {
  query: string;
  limit?: number;
  types?: string[]; // Filter by type (Education, Healthcare, etc.)
  countries?: string[]; // Filter by country code
}

/**
 * Institution Service
 * Handles institutional lookup and authentication using external APIs
 */
export class InstitutionService {
  private static readonly ROR_API_BASE = 'https://api.ror.org';
  private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
  private static cache = new Map<string, { data: Institution[]; timestamp: number }>();

  /**
   * Search institutions using ROR API
   * ROR (Research Organization Registry) is the industry standard for research institutions
   *
   * @param params Search parameters
   * @returns List of matching institutions
   */
  static async searchInstitutions(
    params: InstitutionSearchParams
  ): Promise<Institution[]> {
    const { query, limit = 20, types = ['Education'], countries = [] } = params;

    if (!query || query.trim().length < 2) {
      return [];
    }

    // Check cache first
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Call ROR API
      const response = await fetch(
        `${this.ROR_API_BASE}/organizations?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ROR API error: ${response.status}`);
      }

      const data = await response.json();
      const results: RORSearchResult[] = data.items || [];

      // Transform ROR results to our Institution format
      let institutions = results.map(org => this.transformRORToInstitution(org));

      // Filter by type (Education, Healthcare, etc.)
      if (types.length > 0) {
        institutions = institutions.filter(inst =>
          inst.type.some(t => types.includes(t))
        );
      }

      // Filter by country
      if (countries.length > 0) {
        institutions = institutions.filter(inst =>
          countries.includes(inst.countryCode)
        );
      }

      // Limit results
      institutions = institutions.slice(0, limit);

      // Cache results
      this.cache.set(cacheKey, {
        data: institutions,
        timestamp: Date.now(),
      });

      return institutions;
    } catch (error) {
      console.error('Failed to fetch institutions from ROR:', error);
      toast.error('Failed to search institutions. Please try again.');
      return [];
    }
  }

  /**
   * Transform ROR API result to our Institution format
   */
  private static transformRORToInstitution(ror: RORSearchResult): Institution {
    // Determine authentication method based on country and type
    const authMethod = this.determineAuthMethod(ror.country.country_code);

    // Extract Shibboleth entity ID if available (would be in production metadata)
    const shibbolethEntityId = this.extractShibbolethEntityId(ror);

    return {
      id: ror.id.split('/').pop() || ror.id, // Extract ROR ID
      name: ror.name,
      country: ror.country.country_name,
      countryCode: ror.country.country_code,
      city: ror.addresses?.[0]?.city,
      type: ror.types,
      rorId: ror.id,
      homepage: ror.links?.[0],
      shibbolethEntityId,
      authMethod,
      aliases: [...(ror.aliases || []), ...(ror.acronyms || [])],
    };
  }

  /**
   * Determine authentication method based on country
   * In production, this would query federation metadata
   */
  private static determineAuthMethod(
    countryCode: string
  ): 'shibboleth' | 'openathens' | 'orcid' {
    // UK institutions typically use OpenAthens
    if (countryCode === 'GB') {
      return 'openathens';
    }

    // Most other countries use Shibboleth
    // US (InCommon), EU (eduGAIN), etc.
    return 'shibboleth';
  }

  /**
   * Extract Shibboleth entity ID from institution metadata
   * In production, this would query federation metadata services:
   * - InCommon: https://mdq.incommon.org/
   * - UKAMF: https://mdq.ukfederation.org.uk/
   * - eduGAIN: https://mds.edugain.org/
   */
  private static extractShibbolethEntityId(ror: RORSearchResult): string | undefined {
    // In production, you would:
    // 1. Query federation metadata service
    // 2. Match organization by domain or other identifier
    // 3. Return entityID (e.g., "https://idp.stanford.edu/shibboleth")
    //
    // For demonstration, generate a plausible entityID
    const domain = ror.links?.[0]?.replace(/^https?:\/\//, '').split('/')[0];
    if (domain) {
      return `https://idp.${domain}/shibboleth`;
    }
    return undefined;
  }

  /**
   * Get popular institutions (cached worldwide list)
   * This provides instant results while API search loads
   */
  static getPopularInstitutions(): Institution[] {
    return [
      {
        id: '00f54p054',
        name: 'Stanford University',
        country: 'United States',
        countryCode: 'US',
        city: 'Stanford',
        type: ['Education'],
        rorId: 'https://ror.org/00f54p054',
        homepage: 'http://www.stanford.edu/',
        shibbolethEntityId: 'https://idp.stanford.edu/shibboleth',
        authMethod: 'shibboleth',
      },
      {
        id: '02jbv0t02',
        name: 'University of Oxford',
        country: 'United Kingdom',
        countryCode: 'GB',
        city: 'Oxford',
        type: ['Education'],
        rorId: 'https://ror.org/02jbv0t02',
        homepage: 'http://www.ox.ac.uk/',
        shibbolethEntityId: 'https://shib.ox.ac.uk/shibboleth',
        authMethod: 'openathens',
      },
      {
        id: '042nb2s44',
        name: 'Massachusetts Institute of Technology',
        country: 'United States',
        countryCode: 'US',
        city: 'Cambridge',
        type: ['Education'],
        rorId: 'https://ror.org/042nb2s44',
        homepage: 'http://web.mit.edu/',
        shibbolethEntityId: 'https://idp.mit.edu/shibboleth',
        authMethod: 'shibboleth',
      },
      {
        id: '013meh722',
        name: 'University of Cambridge',
        country: 'United Kingdom',
        countryCode: 'GB',
        city: 'Cambridge',
        type: ['Education'],
        rorId: 'https://ror.org/013meh722',
        homepage: 'http://www.cam.ac.uk/',
        shibbolethEntityId: 'https://shib.raven.cam.ac.uk/shibboleth',
        authMethod: 'openathens',
      },
      {
        id: '02tyrky19',
        name: 'University of Toronto',
        country: 'Canada',
        countryCode: 'CA',
        city: 'Toronto',
        type: ['Education'],
        rorId: 'https://ror.org/02tyrky19',
        homepage: 'https://www.utoronto.ca/',
        shibbolethEntityId: 'https://idp.utoronto.ca/shibboleth',
        authMethod: 'shibboleth',
      },
    ];
  }

  /**
   * Initiate SSO authentication
   * In production, this would redirect to Shibboleth/OpenAthens
   *
   * PRODUCTION IMPLEMENTATION:
   * 1. Redirect to institution's SSO login page
   * 2. User authenticates with institution credentials
   * 3. SAML assertion returned to your service
   * 4. Verify assertion and create session
   * 5. Grant access to licensed resources
   */
  static async initiateSSO(institution: Institution): Promise<{
    success: boolean;
    redirectUrl?: string;
    error?: string;
  }> {
    // In production, this would:
    // return {
    //   success: true,
    //   redirectUrl: institution.shibbolethEntityId + '/login?return=' + encodeURIComponent(window.location.href)
    // };

    // For demonstration, simulate SSO flow
    console.log(`[SSO] Initiating ${institution.authMethod} authentication for:`, institution.name);
    console.log(`[SSO] EntityID: ${institution.shibbolethEntityId}`);
    console.log(`[SSO] In production, would redirect to: ${institution.shibbolethEntityId}/login`);

    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          redirectUrl: institution.shibbolethEntityId + '/login',
        });
      }, 500);
    });
  }
}

/**
 * ============================================================================
 * PRODUCTION DEPLOYMENT GUIDE
 * ============================================================================
 *
 * To implement real SSO authentication:
 *
 * 1. BACKEND SETUP (Required)
 *    - Install Shibboleth Service Provider (SP)
 *      ```bash
 *      apt-get install libapache2-mod-shib2  # Debian/Ubuntu
 *      yum install shibboleth  # RedHat/CentOS
 *      ```
 *
 *    - Configure SP with your federation (InCommon, UKAMF, eduGAIN)
 *      - Register your SP with federation
 *      - Download federation metadata
 *      - Configure attribute mapping
 *
 * 2. OPENATHENS (Alternative - Commercial)
 *    - Sign up at https://www.openathens.net/
 *    - Get API credentials
 *    - Use their pre-configured institutions
 *    - Cost: ~$5,000-15,000/year
 *
 * 3. ORCID INTEGRATION
 *    - Register app at https://orcid.org/developer-tools
 *    - Implement OAuth 2.0 flow
 *    - Use ORCID for researcher verification
 *
 * 4. DATABASE LICENSING
 *    - Contact publishers (Elsevier, Springer, Wiley, etc.)
 *    - Negotiate institutional access agreements
 *    - Get IP range authorization or Shibboleth access
 *    - Cost: $10,000-$100,000+ per year depending on size
 *
 * 5. IMPLEMENTATION FLOW
 *    ```
 *    User clicks "Login with Institution"
 *         ↓
 *    Search institutions (ROR API)
 *         ↓
 *    Select institution → Get Shibboleth entityID
 *         ↓
 *    Redirect to: https://idp.institution.edu/sso?return=yourapp.com
 *         ↓
 *    User logs in with institution credentials
 *         ↓
 *    SAML assertion returned to your SP
 *         ↓
 *    Verify assertion, extract attributes (email, affiliation)
 *         ↓
 *    Create session, grant access to licensed content
 *    ```
 *
 * 6. REQUIRED ATTRIBUTES (from SAML assertion)
 *    - eduPersonPrincipalName (username)
 *    - mail (email address)
 *    - eduPersonAffiliation (student, faculty, staff)
 *    - eduPersonScopedAffiliation (includes institution)
 *    - displayName (user's name)
 *
 * 7. SECURITY CONSIDERATIONS
 *    - Validate SAML signatures
 *    - Check assertion expiry
 *    - Verify audience (your SP entity ID)
 *    - Use HTTPS for all SSO communications
 *    - Implement logout (SingleLogout)
 *
 * ============================================================================
 * COST ESTIMATES
 * ============================================================================
 *
 * - Shibboleth Setup (DIY): Free (server costs only)
 * - OpenAthens Service: $5,000-15,000/year
 * - Database Licenses: $10,000-$100,000+/year
 * - Developer Time: 40-80 hours for full implementation
 * - Maintenance: 5-10 hours/month
 *
 * ============================================================================
 */
