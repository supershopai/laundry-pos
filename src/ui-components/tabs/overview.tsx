/*
 * Copyright 2024 RSC-Labs, https://rsoftcon.com/
 *
 * MIT License
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Alert, Container } from "@medusajs/ui"
import { Grid } from "@mui/material";
import { 
  OrdersOverviewCard,
  SalesOverviewCard,
  CustomersOverviewCard,
  SalesChannelPopularityCard,
  RegionsPopularityCard,
  VariantsTopByCountCard,
  OrderStatus,
  ProductsSoldCountCard,
  CumulativeCustomersCard,
  CardWrapper
} from '..';
import type { DateRange } from '..';

const InfoBox = () => {
  return (
    <Alert variant="info">Click on other tabs to see more statistics.</Alert>
  )
}

const OverviewTab = ({orderStatuses, dateRange, dateRangeCompareTo, compareEnabled} : 
  {orderStatuses: OrderStatus[], dateRange?: DateRange, dateRangeCompareTo?: DateRange, compareEnabled: boolean}) => {

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={12} xl={12}>
        <CardWrapper>
          <OrdersOverviewCard orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={12} xl={12}>
        <CardWrapper>
          <SalesOverviewCard orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={12} xl={12}>
        <CardWrapper>
          <CustomersOverviewCard dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={12} xl={12}>
        <CardWrapper>
          <CumulativeCustomersCard dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={6} xl={4}>
        <CardWrapper style={{ height: 420 }}>
          <VariantsTopByCountCard orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={6} xl={4}>
        <CardWrapper style={{ height: 420 }}>
          <SalesChannelPopularityCard orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={6} xl={4}>
        <CardWrapper style={{ height: 420 }}>
          <RegionsPopularityCard orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={6} xl={4}>
        <CardWrapper style={{ height: 420 }}>
          <ProductsSoldCountCard orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
        </CardWrapper>
      </Grid>
      <Grid item xs={12} md={12} xl={12} marginTop={3} marginBottom={10}>
        <Grid container justifyContent={'center'}>
          <Grid item>
            <InfoBox/>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default OverviewTab