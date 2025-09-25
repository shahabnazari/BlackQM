# 🚀 PHASE 9 DAY 1: IMMEDIATE IMPLEMENTATION PLAN

## ⚡ QUICK START - What to Build RIGHT NOW

### Step 1: Create Backend Module & Controller (30 minutes)

#### 1.1 Create `/backend/src/modules/literature/literature.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LiteratureController } from './literature.controller';
import { LiteratureService } from '../../services/literature.service';
import { LiteratureGateway } from './literature.gateway';
import { PrismaService } from '../../common/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [LiteratureController],
  providers: [LiteratureService, LiteratureGateway, PrismaService],
  exports: [LiteratureService],
})
export class LiteratureModule {}
```

#### 1.2 Create `/backend/src/modules/literature/literature.controller.ts`:
```typescript
import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { LiteratureService } from '../../services/literature.service';

@Controller('api/literature')
export class LiteratureController {
  constructor(private readonly literatureService: LiteratureService) {}

  @Post('search')
  async searchLiterature(@Body() params: any) {
    return this.literatureService.searchLiterature(params);
  }

  @Get('gaps')
  async analyzeGaps(@Query() params: any) {
    return this.literatureService.analyzeResearchGaps(params);
  }

  @Post('export')
  async exportPapers(@Body() body: any) {
    const { papers, format } = body;
    return this.literatureService.exportPapers(papers, format);
  }

  @Post('save')
  async savePaper(@Body() body: any) {
    const { userId, paper } = body;
    return this.literatureService.savePaperToLibrary(userId, paper);
  }
}
```

#### 1.3 Move existing service to modules folder:
```bash
# Move the service to the proper location
mv backend/src/services/literature.service.ts backend/src/modules/literature/
```

#### 1.4 Register module in `app.module.ts`:
```typescript
// Add to imports array:
import { LiteratureModule } from './modules/literature/literature.module';

// Add to imports:
imports: [
  // ... existing modules
  LiteratureModule, // Add this line
]
```

### Step 2: Create WebSocket Gateway (20 minutes)

Create `/backend/src/modules/literature/literature.gateway.ts`:
```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/literature',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class LiteratureGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('LiteratureGateway');

  afterInit(server: Server) {
    this.logger.log('Literature WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('search_update')
  handleSearchUpdate(client: Socket, payload: any): void {
    this.server.emit('search_progress', payload);
  }

  broadcastNewPaper(paper: any) {
    this.server.emit('new_paper', paper);
  }

  broadcastGapUpdate(gap: any) {
    this.server.emit('gap_update', gap);
  }
}
```

### Step 3: Update Frontend to Use Real API (30 minutes)

#### 3.1 Create `/frontend/lib/api/literature.api.ts`:
```typescript
import { apiClient } from './client';

export interface LiteratureSearchParams {
  query: string;
  yearRange?: [number, number];
  journals?: string[];
  authors?: string[];
  keywords?: string[];
  citationMin?: number;
  qMethodologyOnly?: boolean;
  limit?: number;
  offset?: number;
}

export const literatureAPI = {
  search: async (params: LiteratureSearchParams) => {
    const response = await apiClient.post('/api/literature/search', params);
    return response.data;
  },

  analyzeGaps: async (field: string, papers: any[]) => {
    const response = await apiClient.get('/api/literature/gaps', {
      params: { field, paperIds: papers.map(p => p.id) }
    });
    return response.data;
  },

  exportPapers: async (papers: any[], format: 'bibtex' | 'ris' | 'json') => {
    const response = await apiClient.post('/api/literature/export', {
      papers,
      format
    });
    return response.data;
  },

  savePaper: async (paper: any) => {
    const response = await apiClient.post('/api/literature/save', {
      userId: 'current-user', // Get from auth context
      paper
    });
    return response.data;
  }
};
```

#### 3.2 Update `/frontend/app/(researcher)/discover/literature/page.tsx`:
Replace the mock search function (lines 72-144) with:
```typescript
import { literatureAPI } from '@/lib/api/literature.api';
import { useToast } from '@/components/ui/use-toast';

// Inside the component:
const { toast } = useToast();

const performSearch = useCallback(async () => {
  setIsSearching(true);
  try {
    const results = await literatureAPI.search({
      query: searchQuery,
      ...filters,
    });
    setSearchResults(results);
    
    toast({
      title: "Search Complete",
      description: `Found ${results.length} papers`,
    });
  } catch (error) {
    console.error('Search failed:', error);
    toast({
      title: "Search Failed",
      description: "Please try again later",
      variant: "destructive",
    });
  } finally {
    setIsSearching(false);
  }
}, [searchQuery, filters, toast]);
```

### Step 4: Add Missing API Keys to `.env` (10 minutes)

Add to `/backend/.env.local`:
```env
# Academic APIs (most are free)
SEMANTIC_SCHOLAR_API_KEY=your_key_here
CORE_API_KEY=your_key_here
EUROPE_PMC_API_KEY=not_required
DOAJ_API_KEY=not_required

# Social Media APIs (apply for access)
TWITTER_API_KEY=your_key_here
TWITTER_API_SECRET=your_secret_here
REDDIT_CLIENT_ID=your_id_here
REDDIT_CLIENT_SECRET=your_secret_here

# News & Content APIs
NEWSAPI_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
```

### Step 5: Create WebSocket Connection in Frontend (20 minutes)

Create `/frontend/lib/hooks/useLiteratureSocket.ts`:
```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useLiteratureSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:4000/literature', {
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to literature socket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from literature socket');
      setIsConnected(false);
    });

    socketInstance.on('new_paper', (paper) => {
      console.log('New paper found:', paper);
      // Update your state here
    });

    socketInstance.on('search_progress', (progress) => {
      console.log('Search progress:', progress);
      // Update progress indicator
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};
```

### Step 6: Test the Connection (10 minutes)

1. **Restart backend:**
```bash
cd backend
npm run start:dev
```

2. **Test the API endpoint:**
```bash
curl -X POST http://localhost:4000/api/literature/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Q methodology", "limit": 10}'
```

3. **Check frontend:**
- Navigate to http://localhost:3000/discover/literature
- Open DevTools Network tab
- Try a search
- You should see real API calls instead of mock data

## 🎯 Day 1 Success Checklist

- [ ] Literature module created and registered
- [ ] Controller with 4 endpoints working
- [ ] WebSocket gateway initialized
- [ ] Frontend calling real API
- [ ] At least 1 real API (CrossRef) returning data
- [ ] No TypeScript errors added
- [ ] Basic error handling in place

## 🚨 Common Issues & Fixes

### Issue: Module not found
**Fix:** Make sure to register LiteratureModule in app.module.ts

### Issue: CORS errors
**Fix:** Check that your backend CORS config includes localhost:3000

### Issue: API returns empty
**Fix:** CrossRef doesn't need API key, test with it first

### Issue: WebSocket not connecting
**Fix:** Ensure backend is running on port 4000

## 📊 Day 1 Metrics

By end of Day 1, you should have:
- 4 working API endpoints
- 1 WebSocket connection
- Real data from at least 1 academic API
- Frontend showing real search results
- 0 new TypeScript errors

## 🔮 Day 2 Preview

Tomorrow you'll add:
- Remaining academic APIs (PubMed, arXiv, Semantic Scholar)
- Database persistence for papers
- Caching layer for API responses
- Advanced search filters
- Progress indicators with WebSocket

## 💡 Pro Tips

1. **Start with CrossRef** - It doesn't need an API key
2. **Use Postman** to test endpoints before connecting frontend
3. **Add console.log** liberally to debug the flow
4. **Commit after each working step** to avoid losing progress
5. **Run tests frequently** to catch issues early

---

**Time Estimate:** 2 hours to complete Day 1
**Difficulty:** Medium
**Support:** Check existing analysis.module for patterns