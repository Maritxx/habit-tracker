import { Habit, Category, Completion, HabitCollection, CategoryCollection, CompletionCollection } from "./types"

export interface Persistence {
  // The LocalStorage version of this API does not require promises because LocalStorage can be accessed synchronously;
  //   however, because this interface will be used by localStorage API as well as a future database implementation,
  //   making sure that all methods return a Promise<T> will allow us to swap out implementations without making a lot
  //   of additional changes to our source code beyond creating a new class that implements Persistence 
  //   (for postgres/mysql/mongodb/firebase/etc)

  getHabit: ( id: string ) => Promise<Habit | null>
  getAllHabits: () => Promise<HabitCollection>
  getHabitsByCategory: ( categoryID: string ) => Promise<HabitCollection>
  getHabitsByDate: ( date: Date, isComplete: boolean ) => Promise<HabitCollection>
  
  getCategory: ( id: string ) => Promise<Category | null>
  getAllCategories: () => Promise<CategoryCollection>
  
  getAllCompletions: () => Promise<CompletionCollection>
  getCompletionsByHabit: ( habitID: string ) => Promise<CompletionCollection>
  getCompletionsByDate: ( date: Date ) => Promise<CompletionCollection>
  getCompletionsByWeek: ( date: Date ) => Promise<CompletionCollection> // calculate start date and end date, return the week

  createHabit: ( name: string, categoryID: string | null ) => Promise<Habit>
  createCategory: ( name: string, color: string ) => Promise<Category>
  createCompletion: ( habitID: string, date: Date ) => Promise<Completion>

  updateHabit: ( habitID: string, updates: Partial<Habit> ) => Promise<Habit | null>
  updateCategory: ( categoryID: string, updates: Partial<Category> ) => Promise<Category | null>
  // instead of just Partial<Type>, this should probably be a more complex
  //   Partial<Omit<Type, 'id'>>   <-   This will prevent us from accidentally overwriting the primary key 'id',
  //   which would have undefined behavior
  
  deleteHabit: ( id: string ) => Promise<void>
  deleteCategory: ( id: string  ) => Promise<void>
  deleteCompletion: ( id: string ) => Promise<void>

}
