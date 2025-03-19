void UpdateDynamicTrailingStop()
{
   // Loop through all open orders for the current symbol
   for(int i = OrdersTotal()-1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() != Symbol()) continue;
         
         // Process only Buy orders (similar logic applies to Sell orders, inverting comparisons)
         if(OrderType() == OP_BUY)
         {
            double currentPrice = Bid;
            double openPrice    = OrderOpenPrice();
            double currentSL    = OrderStopLoss();
            double newSL        = currentSL; // initialize with current SL

            // Phase 1: When current price reaches TP1, move SL to break-even + TrailingPips1
            if(currentPrice >= TP1)
            {
               double phase1SL = openPrice + TrailingPips1 * Point;
               if(phase1SL > newSL)
                  newSL = phase1SL;
            }
            
            // Phase 2: When current price reaches TP2, set SL just below TP2 (e.g. TP2 minus a small buffer)
            if(currentPrice >= TP2)
            {
               double phase2SL = TP2 - TrailingBuffer * Point;
               if(phase2SL > newSL)
                  newSL = phase2SL;
            }
            
            // Phase 3: As price nears TP3 (e.g. within 5%), trail SL dynamically at a percentage below current price
            if(currentPrice >= TP3 * (1 - 0.05))
            {
               double phase3SL = currentPrice - (PercentageTrailing * currentPrice);
               if(phase3SL > newSL)
                  newSL = phase3SL;
            }
            
            // Modify the order's SL if a higher (more protective) SL is found
            if(newSL > currentSL)
               OrderModify(OrderTicket(), openPrice, newSL, OrderTakeProfit(), 0, clrBlue);
         }
      }
   }
}
