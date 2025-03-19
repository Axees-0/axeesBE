//+------------------------------------------------------------------+
//|                                         MetaTrader 4 Manager API |
//|                             Copyright 2000-2023, MetaQuotes Ltd. |
//|                                               www.metaquotes.net |
//+------------------------------------------------------------------+
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <windows.h>
#include <winsock2.h>
#include "MT4ManagerAPI.h"

//+------------------------------------------------------------------+
//| Manager API wrapper class                                        |
//+------------------------------------------------------------------+
class CManager
{
private:
   CManagerFactory   m_factory;
   CManagerInterface *m_manager;

public:
   CManager() : m_factory(), m_manager(NULL)
   {
      m_factory.WinsockStartup();
      if(m_factory.IsValid()==FALSE || (m_manager=m_factory.Create(ManAPIVersion))==NULL)
      {
         printf("Failed to create MetaTrader 4 Manager API interface\n");
         return;
      }
   }

   ~CManager()
   {
      if(m_manager!=NULL)
      {
         if(m_manager->IsConnected())
            m_manager->Disconnect();
         m_manager->Release();
         m_manager=NULL;
      }
      m_factory.WinsockCleanup();
   }

   bool IsValid()
   {
      return(m_manager!=NULL);
   }

   CManagerInterface* operator->()
   {
      return(m_manager);
   }
};

//+------------------------------------------------------------------+
//| Test functions                                                   |
//+------------------------------------------------------------------+
bool TestConnection(CManager& manager, const char* server, int login, const char* password)
{
   int res;
   
   printf("\n[TEST 1] Basic Connection Test\n");
   printf("------------------------------\n");
   printf("Testing basic connection to MT4 server...\n\n");
   
   // Connect to MT4 server
   if((res=manager->Connect(server))!=RET_OK)
   {
      printf("Connect to %s failed (%s)\n", server, manager->ErrorDescription(res));
      return false;
   }
   
   printf("Connected to %s\n", server);
   
   // Login to MT4 server
   if((res=manager->Login(login, password))!=RET_OK)
   {
      printf("Login as '%d' failed (%s)\n", login, manager->ErrorDescription(res));
      manager->Disconnect();
      return false;
   }
   
   printf("Login as '%d' successful\n", login);
   
   // Get server time
   __time32_t server_time = manager->ServerTime();
   time_t time_val = server_time;
   printf("Server time: %s", ctime(&time_val));
   
   // Get common information
   ConCommon common;
   if(manager->CommonGet(&common)==RET_OK)
   {
      printf("Server info:\n");
      printf("  Name: %s\n", common.name);
      printf("  Owner: %s\n", common.owner);
      printf("  Time difference: %d minutes\n", common.timezoneshift);
   }
   
   // Disconnect
   manager->Disconnect();
   printf("Disconnected from server\n");
   printf("\n[TEST 1] Basic Connection Test: PASSED\n\n");
   
   return true;
}

bool TestUserInfo(CManager& manager, const char* server, int login, const char* password)
{
   int res;
   
   printf("\n[TEST 2] User Information Test\n");
   printf("-----------------------------\n");
   printf("Testing User Information functions...\n\n");
   
   // Connect to MT4 server
   if((res=manager->Connect(server))!=RET_OK)
   {
      printf("Connect to %s failed (%s)\n", server, manager->ErrorDescription(res));
      return false;
   }
   
   // Login to MT4 server
   if((res=manager->Login(login, password))!=RET_OK)
   {
      printf("Login failed (%s)\n", manager->ErrorDescription(res));
      manager->Disconnect();
      return false;
   }
   
   printf("Connected to %s and logged in successfully\n\n", server);
   
   // Get user count
   int totalUsers = manager->UsersTotal();
   printf("Total users: %d\n", totalUsers);
   
   // Get user info for a specific account (our own login)
   UserRecord user;
   if(manager->UserRecordGet(login, &user)==RET_OK)
   {
      printf("User information for account %d:\n", login);
      printf("  Name: %s\n", user.name);
      printf("  Group: %s\n", user.group);
      printf("  Balance: %.2f %s\n", user.balance, user.currency);
      printf("  Leverage: 1:%d\n", user.leverage);
   }
   else
   {
      printf("Could not retrieve user information for account %d\n", login);
   }
   
   // Get available groups
   ConGroup* groups;
   int total = 0;
   
   if((groups=manager->GroupsGet(&total))!=NULL && total>0)
   {
      printf("\nAvailable user groups: %d\n", total);
      for(int i=0; i<total && i<5; i++)
         printf("  - %s\n", groups[i].group);
      
      if(total > 5)
         printf("  ... and %d more\n", total-5);
      
      manager->MemFree(groups);
   }
   
   // Disconnect
   manager->Disconnect();
   printf("\nDisconnected from server\n");
   printf("\n[TEST 2] User Information Test: PASSED\n\n");
   
   return true;
}

bool TestSymbols(CManager& manager, const char* server, int login, const char* password)
{
   int res;
   
   printf("\n[TEST 3] Symbol Functions Test\n");
   printf("----------------------------\n");
   printf("Testing Symbol functions...\n\n");
   
   // Connect to MT4 server
   if((res=manager->Connect(server))!=RET_OK)
   {
      printf("Connect to %s failed (%s)\n", server, manager->ErrorDescription(res));
      return false;
   }
   
   // Login to MT4 server
   if((res=manager->Login(login, password))!=RET_OK)
   {
      printf("Login failed (%s)\n", manager->ErrorDescription(res));
      manager->Disconnect();
      return false;
   }
   
   printf("Connected to %s and logged in successfully\n\n", server);
   
   // Get symbol count
   int totalSymbols = manager->SymbolsTotal();
   printf("Total symbols: %d\n\n", totalSymbols);
   
   // Get symbols configuration
   ConSymbol* symbols;
   int total = 0;
   
   if((symbols=manager->SymbolsGetAll(&total))!=NULL && total>0)
   {
      printf("Available trading symbols: %d\n", total);
      for(int i=0; i<total && i<5; i++)
      {
         printf("  Symbol: %s\n", symbols[i].symbol);
         printf("    Description: %s\n", symbols[i].description);
         printf("    Digits: %d\n", symbols[i].digits);
         printf("    Trade mode: %d\n", symbols[i].trade);
      }
      
      if(total > 5)
         printf("  ... and %d more\n", total-5);
      
      manager->MemFree(symbols);
   }
   
   // Get symbol info for specific symbols
   SymbolInfo info;
   const char* commonSymbols[] = {"EURUSD", "GBPUSD", "USDJPY"};
   
   printf("\nCurrent quotes for common symbols:\n");
   for(int i=0; i<3; i++)
   {
      if(manager->SymbolInfoGet(commonSymbols[i], &info)==RET_OK)
      {
         double spread = (info.ask - info.bid) * pow(10, info.digits);
         printf("  %s: Bid=%.*f Ask=%.*f Spread=%.1f pips\n", 
                commonSymbols[i], info.digits, info.bid, info.digits, info.ask, spread);
      }
      else
      {
         printf("  %s: Not available\n", commonSymbols[i]);
      }
   }
   
   // Disconnect
   manager->Disconnect();
   printf("\nDisconnected from server\n");
   printf("\n[TEST 3] Symbol Functions Test: PASSED\n\n");
   
   return true;
}

bool TestTrades(CManager& manager, const char* server, int login, const char* password)
{
   int res;
   
   printf("\n[TEST 4] Trade Functions Test\n");
   printf("--------------------------\n");
   printf("Testing Trade functions...\n\n");
   
   // Connect to MT4 server
   if((res=manager->Connect(server))!=RET_OK)
   {
      printf("Connect to %s failed (%s)\n", server, manager->ErrorDescription(res));
      return false;
   }
   
   // Login to MT4 server
   if((res=manager->Login(login, password))!=RET_OK)
   {
      printf("Login failed (%s)\n", manager->ErrorDescription(res));
      manager->Disconnect();
      return false;
   }
   
   printf("Connected to %s and logged in successfully\n\n", server);
   
   // Get trades count
   int totalTrades = manager->TradesTotal();
   printf("Total trades: %d\n", totalTrades);
   
   // Get open trades
   TradeRecord* trades;
   int total = 0;
   
   if((trades=manager->TradesGet(&total))!=NULL && total>0)
   {
      printf("\nOpen positions: %d\n", total);
      for(int i=0; i<total && i<5; i++)
      {
         const char* type = (trades[i].cmd == OP_BUY) ? "Buy" : (trades[i].cmd == OP_SELL) ? "Sell" : "Other";
         printf("  Order #%d - %s %s %.2f lots at %.5f\n", 
                trades[i].order, trades[i].symbol, type, trades[i].volume/100.0, trades[i].open_price);
      }
      
      if(total > 5)
         printf("  ... and %d more\n", total-5);
      
      manager->MemFree(trades);
   }
   else
   {
      printf("No open positions found\n");
   }
   
   // Get trade history
   TradeRecord* history;
   total = 0;
   time_t now = time(NULL);
   time_t weekAgo = now - 7*24*60*60;
   
   if((history=manager->TradesGetHistory(weekAgo, now, &total))!=NULL && total>0)
   {
      printf("\nTrade history (last 7 days): %d\n", total);
      for(int i=0; i<total && i<5; i++)
      {
         const char* type = (history[i].cmd == OP_BUY) ? "Buy" : (history[i].cmd == OP_SELL) ? "Sell" : "Other";
         time_t closeTime = history[i].close_time;
         printf("  Order #%d - %s %s %.2f lots - Profit: %.2f %s - Closed: %s", 
                history[i].order, history[i].symbol, type, history[i].volume/100.0, 
                history[i].profit, history[i].currency, ctime(&closeTime));
      }
      
      if(total > 5)
         printf("  ... and %d more\n", total-5);
      
      manager->MemFree(history);
   }
   else
   {
      printf("\nNo trade history found for the last 7 days\n");
   }
   
   // Disconnect
   manager->Disconnect();
   printf("\nDisconnected from server\n");
   printf("\n[TEST 4] Trade Functions Test: PASSED\n\n");
   
   return true;
}

//+------------------------------------------------------------------+
//| Main function                                                    |
//+------------------------------------------------------------------+
int main(int argc, char* argv[])
{
   printf("MetaTrader 4 Manager API: Comprehensive Test\n");
   printf("Copyright 2000-2023, MetaQuotes Ltd.\n\n");
   
   // Check parameters
   if(argc < 4)
   {
      printf("Usage: test_mt4_manager.exe server login password [test_num]\n");
      printf("Examples:\n");
      printf("  test_mt4_manager.exe localhost:443 123 password     # Run all tests\n");
      printf("  test_mt4_manager.exe localhost:443 123 password 2   # Run test #2 only\n");
      return(0);
   }
   
   // Parse parameters
   const char* server = argv[1];
   int login = atoi(argv[2]);
   const char* password = argv[3];
   int testNum = (argc > 4) ? atoi(argv[4]) : 0;
   
   printf("Server: %s\n", server);
   printf("Login: %d\n", login);
   printf("Password: %s\n", password);
   
   // Create manager interface
   CManager manager;
   if(!manager.IsValid())
   {
      printf("Failed to initialize MT4 Manager API\n");
      return(-1);
   }
   
   // Run specified test or all tests
   bool result = true;
   
   if(testNum == 0 || testNum == 1)
      result &= TestConnection(manager, server, login, password);
   
   if(testNum == 0 || testNum == 2)
      result &= TestUserInfo(manager, server, login, password);
   
   if(testNum == 0 || testNum == 3)
      result &= TestSymbols(manager, server, login, password);
   
   if(testNum == 0 || testNum == 4)
      result &= TestTrades(manager, server, login, password);
   
   printf("\n-----------------------------------------------\n");
   printf("MT4 Manager API Test %s\n", result ? "COMPLETED SUCCESSFULLY" : "FAILED");
   printf("-----------------------------------------------\n");
   
   return(result ? 0 : -1);
}
//+------------------------------------------------------------------+