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

import { Container } from "@medusajs/ui"
import { 
  CustomersOverviewCard,
  CustomersRepeatCustomerRate,
  CumulativeCustomersCard,
  CustomersRetentionCustomerRate,
  OrderStatus,
  CardWrapper,
} from '..';
import type { DateRange } from '..';
import { Grid } from "@mui/material";

const CustomersTab = ({orderStatuses, dateRange, dateRangeCompareTo, compareEnabled} : 
  {orderStatuses: OrderStatus[], dateRange?: DateRange, dateRangeCompareTo?: DateRange, compareEnabled: boolean}) => {
    return (
      <Grid container spacing={2}>
        {/* Graph cards on top full width */}
        <Grid item xs={12} md={12} xl={12}>
          <CardWrapper>
            <CustomersRepeatCustomerRate orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
          </CardWrapper>
        </Grid>
        <Grid item xs={12} md={12} xl={12}>
          <CardWrapper>
            <CustomersRetentionCustomerRate orderStatuses={orderStatuses} dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
          </CardWrapper>
        </Grid>

        {/* Data cards with same height */}
        <Grid item xs={12} md={6} xl={4}>
          <CardWrapper style={{ height: 420 }}>
            <CustomersOverviewCard dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
          </CardWrapper>
        </Grid>
        <Grid item xs={12} md={6} xl={4}>
          <CardWrapper style={{ height: 420 }}>
            <CumulativeCustomersCard dateRange={dateRange} dateRangeCompareTo={dateRangeCompareTo} compareEnabled={compareEnabled}/>
          </CardWrapper>
        </Grid>
      </Grid> 
    )
}

export default CustomersTab