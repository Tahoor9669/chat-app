// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${currentUser.token}`)
      .set('Content-Type', 'application/json');
    
    return this.http.get<any[]>(this.apiUrl, { headers });
  }
}