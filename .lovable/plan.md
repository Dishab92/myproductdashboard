

# Seed Agent Helper Roadmap Items from Google Sheets

Insert all ~60 roadmap items visible in the uploaded screenshots into the `roadmap_items` table via a database migration.

---

## Data Extracted from Screenshots

The two images show the same dataset from different column perspectives:
- **IMG_6858**: Title (col A), Status (col B), Feature Type (col C), Feature Source (col D)
- **IMG_6859**: Status (col B), Feature Type (col C), Feature Source (col D), Priority (col E), Comments (col F)

## Approach

Run a single SQL migration that inserts all items. Since RLS requires an `owner_id`, the migration will use a database function approach -- inserting with a placeholder owner_id that will be updated on first login, OR we insert them as service-role bypassing RLS (migrations run as superuser so RLS is bypassed).

### Key mapping decisions:
- `product_type` = 'Agent Helper' for all rows
- `customer_visibility` = 'Internal' (default)
- All score fields default to 0 (no scoring data in the sheets)
- `target_bucket` = 'Future' (no bucket data visible in the sheets)
- Comments from column F map to `notes`

### Items to insert (~60 rows including):

| # | Title | Status | Feature Type | Feature Source | Priority | Comments |
|---|-------|--------|-------------|----------------|----------|----------|
| 1 | Jira Integration (Zendesk and Salesforce) | Complete | New Feature | Product | P0 | |
| 2 | Case Escalation Rate - Zendesk | Complete | Analytics & Reporting | Product | P1 | |
| 3 | Remove Train button and status button and add created date and time button | Complete | UX Improvement | Product | P2 | |
| 4 | Agent Helper Overview Tab - Analytics | Complete | Analytics & Reporting | Product | P1 | |
| 5 | Preserve RA - Zendesk | Complete | New Feature | Product | P1 | |
| 6 | Multilingual Support - Zendesk | Complete | New Feature | Product | P0 | |
| 7 | Response assist Adoption Metrics (Zendesk) | Complete | Analytics & Reporting | Product | P0 | |
| 8 | Response assist Adoption Metrics (Salesforce) | Complete | Analytics & Reporting | Product | P0 | |
| 9 | Case timeline Enhancement (Customer Feedback) | Complete | UX Improvement | Product | P0 | |
| 10 | Case Summary UI updates (Rubrik POC improvement) | Complete | UI Improvement | Product | P2 | |
| 11 | Front End Enhancement Report | Complete | Analytics & Reporting | Product | P2 | |
| 12 | Integration of Individual Slack in Top Experts (Zendesk) | Complete | Enhancement/Optimization | Product | P0 | |
| 13 | Comprehensive RA adoption Tracking with ClickC | Complete | Enhancement/Optimization | Product | P1 | |
| 14 | All Open in new tab (Zendesk) | Complete | New Feature | CSM | P1 | |
| 15 | Top Reports (Customer Request, Rubrik) | Complete | Analytics & Reporting | Product | P0 | |
| 16 | Agent wise Adoption Metrics | Complete | Analytics & Reporting | Product | P0 | |
| 17 | Mean Time To Resolution | Complete | Analytics & Reporting | Product | P0 | |
| 18 | Discontinue "Disabled" Case Summary in AH | Complete | Enhancement/Optimization | CSM | P1 | |
| 19 | Display Case Resolution in Top Related Cases With LLM and add agents name to the case | Complete | New Feature | Product | P1 | |
| 20 | Implement Multi Query Search Execution Using Rephrased Queries with Aggregation Support (TD) | In Development | Relevance | Product | P1 | |
| 21 | Implement LLM Based Filtering to Identify Search Results That Can Solve the Case (TD) | In Development | Relevance | CSM | P1 | |
| 22 | Dual Response Generation (TD) | In Development | Enhancement | Product | P1 | |
| 23 | Direct Comment To Salesforce | Complete | New Feature | Product | P1 | |
| 24 | Live Customer Sentiment | Complete | New Feature | Product | P1 | |
| 25 | Zendesk Alt: Flexible Case Summary View (Resizable & Switchable Position) (Customer Feedback - Jabra) | Complete | UX Improvement | Customer Request | P1 | |
| 26 | Minimal Feedback Popup with Auto-Detected Reasons | Complete | UX Improvement | Product | P1 | |
| 27 | Top Related Articles: Enriched List + Source Filter + Attach to Case | In Development | New Feature | Product | P1 | |
| 28 | Dynamic Loader with Contextual Narration | Complete | Analytics & Reporting | Product | P0 | |
| 29 | Agent assigned through recommendations should be notified through slack, email and salesforce alert that new case has been assigned | To be planned for dev | New Feature | Product | P2 | |
| 30 | Add case status in case timeline | In Story writing | Enhancement/Optimization | Product | P0 | |
| 31 | License Management | In Development | New Feature | Product | P0 | |
| 32 | Query Rephraser Enhancement | Grooming to be planned | Enhancement/Optimization | Product | P0 | |
| 33 | ROI Impact Report (approach) | In Development | New Feature | Customer Request | P0 | |
| 34 | ROI Impact report Benchmark Settings | Grooming to be planned | New Feature | Customer Request | P0 | |
| 35 | Manually select/de-select ticket ID (Standalone AH) | With Design | Enhancement/Optimization | CSM | P1 | |
| 36 | AI Assistant in Standard | In Development | New Feature | Product | P1 | |
| 37 | Custom Time COnfiguration (Org wide) | Grooming to be planned | New Feature | Product | P1 | |
| 38 | Feedback Analysis Enhancement | Grooming to be planned | Analytics & Reporting | Product | P1 | |
| 39 | Nerfs to admin regarding LLM errors | Grooming to be planned | New Feature | Product | P0 | Admin side |
| 40 | Intelligent Searching in Slack and Case Timeline Integration | Grooming to be planned | New Feature | CSM | P1 | |
| 41 | Ability to create a Jira Ticket Within in AH | Grooming to be planned | New Feature | Product | P1 | |
| 42 | Zendesk Stand alone app - Improvements (Similar to what we did for accela) | Grooming to be planned | New Feature | Product | P2 | |
| 43 | Deploy Feedback icon in Top Related Cases Top Related Articles and Top Experts (Rubrik) | On Hold | New Feature | Product | P1 | |
| 44 | Key Moments Auto-Detection in Case Timeline | In Story writing | New Feature | Product | P1 | |
| 45 | Confidence Score & Redirection to Experts | In Story writing | New Feature | Product | P1 | As discussed with Vishal Sir |
| 46 | Prompt Editor | In Story writing | New Feature | Product | P1 | As discussed with Vishal Sir |
| 47 | Exact Time Spent Tracking in Agent Helper | In Story writing | Enhancement/Optimization | Product | P1 | |
| 48 | Multi-modality feature (voice, image, etc.) | To Do | New Feature | CSM | P3 | |
| 49 | Case QA | Engineering Review | New Feature | CSM | P1 | |
| 50 | Case summary with Detailed Next Steps | In Story writing | New Feature | CSM | P1 | |
| 51 | Google Call Transcript Integration | In Story writing | New Feature | Customer Request | P0 | Once command alkon is signed- can be given to PS to build customizations |
| 52 | Voice Transcript Setup Admin | In Story writing | New Feature | Customer Request | P1 | |
| 53 | Remove salutations from the response generated - think about it | In Story writing | New Feature | Customer Request | P0 | Once command alkon is signed- can be given to PS to build customizations |
| 54 | Selected features working for netsuite | To Do | | | | |
| 55 | Response and case summary automatically regenerate as the case progresses | To Do | | | | |
| 56 | Add a toggle button to switch to AI | In QA | Enhancement/Optimization | Product | P0 | |
| 57 | Deterministic Ranking for Top Experts Based on Similar Cases Solved | Grooming to be planned | Enhancement/Optimization | CSM | P0 | |
| 58 | Hide recommendation from AI editor | Grooming to be planned | Enhancement/Optimization | Product | P3 | |
| 59 | When unable to find a response redirected to top experts tab | | Enhancement/Optimization | Product | | |

---

## Implementation

1. **Single SQL migration** inserting all ~59 rows into `roadmap_items`
   - Since migrations run as superuser (bypasses RLS), we need a valid `owner_id`
   - We'll query the first user from `profiles` table to use as owner, or use a subquery
   - All scores default to 0, target_bucket defaults to 'Future'

2. **No code changes needed** -- the existing Agent Helper Roadmap page will automatically display these items once inserted

---

## Technical Details

The migration will use:
```sql
INSERT INTO public.roadmap_items (title, status, feature_type, feature_source, priority, notes, product_type, owner_id)
SELECT 'Title', 'Status', 'Type', 'Source', 'P1', 'comment', 'Agent Helper', id
FROM public.profiles LIMIT 1;
```

This pattern repeats for all ~59 rows, using a CTE to get the owner_id once.

