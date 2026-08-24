#include <bits/stdc++.h>
using namespace std;

int main() {
    long long n, m;
    cin >> n >> m;
    vector<vector<pair<long long,long long>>> adj(n+1);
    for(long long i = 0; i < m; i++) {
        long long u, v, c;
        cin >> u >> v >> c;
        adj[u].push_back({v, c});
    }
    
    vector<long long> dist(n+1, LLONG_MAX);
    dist[1] = 0;
    priority_queue<pair<long long, long long>, vector<pair<long long, long long>>, greater<pair<long long, long long>>> q;
    q.push({0, 1}); // {distance, node}
    while(!q.empty()) { 
        auto [d, u] = q.top();
        q.pop();
        if(d > dist[u]) continue; // Skip if we already found a better path
        for(auto &[v, c] : adj[u]) {
            if(dist[u] + c < dist[v]) {
                dist[v] = dist[u] + c;
                q.push({dist[v], v});
            }
        }
    }
    for(long long i = 1; i <= n; i++) {
        cout << dist[i] << " ";
    }
    return 0;
}