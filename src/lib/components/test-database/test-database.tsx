import { useState } from 'react'
import '../../../App.css'
import './test-database.css'

import { database } from '../../data/local-storage'
import { CategoryCollection, CompletionCollection, HabitCollection } from '../../data/types'


const createHabit = (e: React.FormEvent<HTMLFormElement>) => {
    // I'm sure there's a better way to do this
    e.preventDefault()
    const formElement = e.target
    const { 0: newHabitElement, 1: categorySelectElement } = formElement
    const [newHabitName, category] = [newHabitElement.value, categorySelectElement.value]

    database.createHabit( newHabitName, category )
}

const completeHabit = (habitID: string) => database.createCompletion(habitID, new Date())

const createCategory = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  const formElement = e.target
  const { 0: categoryInputElement, 1: colorInputElement } = formElement
  const [ categoryInput, colorInput ] = [ categoryInputElement.value, colorInputElement.value ]

  database.createCategory( categoryInput, colorInput )
}

const deleteHabit = (habitID: string) => database.deleteHabit( habitID )
const deleteCategory = (categoryID: string) => database.deleteCategory( categoryID )
const deleteCompletion = (completionID: string) => database.deleteCompletion( completionID )

const getColorStyle = ( color: string ) => ({
  color: color ?? 'white',
  textShadow: '1px 1px 2px rgba(0 0 0 / 0.7)'
})

const CompletionDisplay = (
  completions: CompletionCollection, 
  habits: HabitCollection,
  categories: CategoryCollection,
) => <div className="card">
  <h2>Completed Habits</h2>
  {Object.entries(completions).map(([ completionID, completion ]) => 
    <p data-form-item key={completionID}>
      <span className="delete" onClick={() => deleteCompletion(completionID)}>&times;</span>
      <span style={ getColorStyle( categories[ habits[ completion?.habitID ]?.categoryID ]?.color ) }>
        { habits[ completion.habitID ].name }
      </span>
      <span className="subtitle">on { completion.date.toDateString() }</span>
    </p>
  )}
</div>

const HabitsDisplay = (
  habits: HabitCollection,
  categories: CategoryCollection,
) => <div className="card">
  <h2>Habits</h2>
  {Object.entries(habits).map(([ habitID, habit ]) => 
    <p data-form-item key={habitID}>
      <span className="delete" onClick={() => deleteHabit(habitID)}>&times;</span>
      <span onClick={() => completeHabit(habitID)}>{ habit.name }</span>
      {!habit.categoryID || !categories[ habit.categoryID ]
        ? null
        : <span className="subtitle"
          style={{ color: categories[ habit.categoryID ].color ?? 'white' }}>
          { categories[ habit.categoryID ].name }
        </span>}
    </p>
  )}

  <h3>Create new Habit</h3>
  <form name="create-habit-form" onSubmit={ e => createHabit(e) }>
    <input name="new-habit" type="text" placeholder="New Habit"/>
    {Object.keys(categories).length === 0 
      ? null 
      : <select data-form-item>
          <option>Category</option>
          {Object.entries(categories).map(([categoryID, category]) =>
            <option key={`category-select-${ categoryID }`} value={categoryID}>
              { category.name }
            </option>
          )}
        </select>
    }
    <button>Add Habit</button>
  </form>
</div>

const CategoriesDisplay = (categories: CategoryCollection) => <div className="card">
  <h2>Categories</h2>
  {Object.entries( categories ).map( 
    ([ categoryID, category ]) => <p key={ categoryID } data-form-item>
      <span className="delete" onClick={() => deleteCategory( categoryID )}>&times;</span>
      <span style={ getColorStyle( category.color ) }>
        { category.name }
      </span>
    </p>
  )}

  <h3>Create New Category</h3>
  <form name="create-category-form" onSubmit={ e => createCategory(e) }>
    <input name="new-category" type="text" placeholder="New Category"/>
    <input name="new-category-color" type="text" placeholder="Category Color"/>
    <button>Add Category</button>
  </form>
</div>


export default () => {
  const [habits, setHabits] = useState({ } as HabitCollection)
  const [remainingHabits, setRemainingHabits] = useState({ } as HabitCollection)
  const [categories, setCategories] = useState({ } as CategoryCollection)
  const [completions, setCompletions] = useState({ } as CompletionCollection)
  const today = new Date()

  database.getAllHabits().then(habits => setHabits( habits ))
  database.getHabitsByDate(today).then(habits => setRemainingHabits( habits ))
  database.getAllCategories().then(categories => setCategories( categories ))
  database.getAllCompletions().then(completions => setCompletions( completions ))


  return (
    <div className="test-database-methods">
      { Object.entries( completions ).length > 0 ? CompletionDisplay( completions, habits, categories ) : null}
      { HabitsDisplay( remainingHabits, categories ) }
      { CategoriesDisplay( categories ) }
    </div>
  );
}