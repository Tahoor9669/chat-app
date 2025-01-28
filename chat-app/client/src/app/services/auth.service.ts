import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface User {
  _id: string;
  username: string;
  email?: string;
  roles: string[];
}

interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/login`,
      { username, password },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        const userToStore: AuthResponse = {
          user: {
            ...response.user,
            roles: response.user.roles || ['user']
          },
          token: response.token
        };
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        this.currentUserSubject.next(userToStore);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  register(userData: Partial<User>): Observable<AuthResponse> {
    console.log('Registering user:', userData);
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/register`,
      userData,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('Registration response:', response)),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  isUserSuperAdmin(): boolean {
    const currentUser = this.currentUserValue;
    return currentUser?.user?.roles?.includes('super_admin') || false;
  }
}